-- ============================================================================
-- 把评论回复邮件通知从 Supabase Edge Function 改指到 Cloudflare Worker
--
-- 原来的链路：
--   comment INSERT → trigger_send_mail() → pg_net POST
--     → <supabase_url>/functions/v1/send-mail（Edge Function，用 Resend 发信）
--
-- 现在的链路：
--   comment INSERT → trigger_send_mail() → pg_net POST
--     → <notifier_url>/send-mail（apps/notifier，Cloudflare Worker，
--        用 Cloudflare Email Service 发信）
--
-- 触发器本身（on_comment_insert_send_mail）不动，只换函数体里的目标和鉴权头。
--
-- ⚠️ 执行这条迁移之前，必须先在生产库上设好两个 GUC，否则触发器会静默不发信：
--
--     alter database postgres set app.settings.notifier_url =
--       'https://shinano-notifier.<你的子域>.workers.dev';
--     alter database postgres set app.settings.notifier_secret = '<WEBHOOK_SECRET>';
--
--   （notifier_secret 必须和 Worker 上 `wrangler secret put WEBHOOK_SECRET`
--     的值完全一致；改完要新开连接才会生效。）
--
--   原来的 app.settings.supabase_url / app.settings.supabase_service_role_key
--   在本迁移之后就没有使用者了，确认线上稳定之后可以自行 reset 掉。
--
-- 顺带删掉 config 表里的 config_RESEND —— CMS 设置页已经不再提供这个字段，
-- 发信密钥现在是 Worker 的 binding，不再经过数据库。
-- ============================================================================

begin;

-- 触发器函数和触发器本身原先定义在 Darmau/supabase-edge-function 仓库里
-- （20241110000001_create_send_mail_trigger.sql），那个仓库已经废弃，
-- 这里把它们一并纳入 packages/database，保证本目录确实是 schema 的唯一权威来源。
-- create extension / create or replace / drop trigger if exists 都是幂等的，
-- 无论生产库上原来那条迁移跑没跑过，这条都能安全执行。
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_send_mail()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id bigint;
  notifier_url text;
  notifier_secret text;
begin
  -- 只处理 INSERT，且是回复（reply_to 非空）。根评论不需要通知任何人。
  -- 是否真的发信由 Worker 那边再判断一次（receive_notification、is_public 等）。
  if TG_OP = 'INSERT' and NEW.reply_to is not null then

    notifier_url := current_setting('app.settings.notifier_url', true);
    notifier_secret := current_setting('app.settings.notifier_secret', true);

    -- GUC 没配就直接跳过，而不是发一个必然 401 的请求
    if notifier_url is null or notifier_url = '' then
      raise log 'trigger_send_mail: app.settings.notifier_url 未设置，跳过评论 %', NEW.id;
      return NEW;
    end if;

    select net.http_post(
      url := rtrim(notifier_url, '/') || '/send-mail',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || coalesce(notifier_secret, '')
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
  '新评论是回复时，通过 pg_net 通知 apps/notifier Worker 发送邮件（原 send-mail Edge Function）';

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
