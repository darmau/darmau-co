-- ============================================================================
-- 把评论回复邮件通知从 Supabase Edge Function 改指到 Cloudflare Worker
--
-- 原来的链路：
--   comment INSERT → trigger_send_mail() → pg_net POST
--     → <supabase_url>/functions/v1/send-mail（Edge Function，用 Resend 发信）
--
-- 现在的链路：
--   comment INSERT → trigger_send_mail() → pg_net POST
--     → https://notify.darmau.co/send-mail（apps/notifier，Cloudflare Worker，
--        用 Cloudflare Email Service 发信）
--
-- 触发器本身（on_comment_insert_send_mail）不动，只换函数体里的目标和鉴权头。
--
-- ⚠️ 执行这条迁移之前，必须先把 Worker 的 WEBHOOK_SECRET 存进 Supabase Vault，
--    否则触发器会跳过发信（跳过时会写 log，不会发一个必然 401 的请求）：
--
--      select vault.create_secret(
--        '<WEBHOOK_SECRET>',                       -- 和 Worker 上的完全一致
--        'notifier_secret',
--        'apps/notifier 的 Bearer token'
--      );
--
--    之后要轮换：
--      select vault.update_secret(
--        (select id from vault.secrets where name = 'notifier_secret'),
--        '<新值>'
--      );
--
-- 为什么用 Vault 而不是 `alter database ... set app.settings.*`：
--   Supabase 的 postgres 角色不是数据库 owner，ALTER DATABASE 会报 42501。
--   原来那版（来自已废弃的 supabase-edge-function 仓库）就是靠
--   current_setting('app.settings.supabase_url') 取值的，如果那两个 GUC 从来
--   没设置成功，它一直在静默地不发信 —— current_setting(..., true) 返回 NULL，
--   拼出来的 url 也是 NULL。
--
-- Worker 的地址是公开信息，不需要保密，所以直接写死在函数里。将来换域名就再写
-- 一条迁移（本目录的规矩是迁移只增不改）。
--
-- 顺带删掉 config 表里的 config_RESEND —— CMS 设置页已经不再提供这个字段，
-- 发信密钥现在是 Worker 的 binding，不再经过数据库。
-- ============================================================================

begin;

-- 触发器函数和触发器本身原先定义在 Darmau/supabase-edge-function 仓库里
-- （20241110000001_create_send_mail_trigger.sql），那个仓库已经废弃，
-- 这里把它们一并纳入 packages/database，保证本目录确实是 schema 的唯一权威来源。
-- 下面每一步都是幂等的，无论生产库上原来那条迁移跑没跑过都能安全执行。
--
-- pg_net / supabase_vault 在 Supabase 项目上默认就有；supabase/tests/run.sh 用的是
-- 一个干净的 postgres 容器，两个都没有，所以这里按可用性判断，不可用就跳过——
-- 函数体里的 net.http_post 和 vault.decrypted_secrets 都是运行时才解析的，
-- 缺扩展不影响 create or replace function 成功，重放测试照样能验证其余部分。
do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_net') then
    execute 'create extension if not exists pg_net with schema extensions';
  else
    raise notice 'pg_net 不可用，跳过（本地重放环境预期如此）';
  end if;
end
$$;

create or replace function public.trigger_send_mail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id bigint;
  notifier_secret text;
  notifier_url constant text := 'https://notify.darmau.co';
begin
  -- 只处理 INSERT，且是回复（reply_to 非空）。根评论不需要通知任何人。
  -- 是否真的发信由 Worker 那边再判断一次（receive_notification、is_public 等）。
  if TG_OP = 'INSERT' and NEW.reply_to is not null then

    select decrypted_secret into notifier_secret
    from vault.decrypted_secrets
    where name = 'notifier_secret'
    limit 1;

    -- 密钥没配就跳过，而不是发一个必然被 Worker 401 掉的请求
    if notifier_secret is null or notifier_secret = '' then
      raise log 'trigger_send_mail: Vault 里没有 notifier_secret，跳过评论 %', NEW.id;
      return NEW;
    end if;

    select net.http_post(
      url := notifier_url || '/send-mail',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || notifier_secret
      ),
      body := jsonb_build_object(
        'type', TG_OP,
        'table', TG_TABLE_NAME,
        'schema', TG_TABLE_SCHEMA,
        'record', to_jsonb(NEW),
        'old_record', to_jsonb(OLD)
      )
    ) into request_id;

    raise log 'trigger_send_mail: 已投递评论 % 到 notifier，request_id %', NEW.id, request_id;

  end if;

  return NEW;
end;
$$;

comment on function public.trigger_send_mail is
  '新评论是回复时，通过 pg_net 通知 apps/notifier Worker 发送邮件（原 send-mail Edge Function）。密钥读自 Vault 的 notifier_secret';

drop trigger if exists on_comment_insert_send_mail on public.comment;
create trigger on_comment_insert_send_mail
  after insert on public.comment
  for each row
  execute function public.trigger_send_mail();

comment on trigger on_comment_insert_send_mail on public.comment is
  '新评论插入后触发邮件通知';

-- config_RESEND 不再有使用者
delete from public.config where key = 'config_RESEND';

commit;
