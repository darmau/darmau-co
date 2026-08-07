# 前台改动交接说明（2026-08-07 CMS 变更）

给前台项目的 AI：这份文档描述 **2026-08-07 这一天 CMS 对共享 Supabase 数据库做的改动**，
以及前台需要相应做什么。所有迁移**已经推送到生产库并生效**，不是计划，是既成事实。

CMS 侧的迁移文件在 `shinano-cms/supabase/migrations/`，共五个：

| 文件                                       | 内容                     |
| ------------------------------------------ | ------------------------ |
| `20260807000000_p0_security_fixes.sql`     | RLS / 列权限收紧（**前台影响最大**） |
| `20260807010000_p1_data_integrity.sql`     | NOT NULL、触发器修复     |
| `20260807020000_p1_indexes.sql`            | 索引调整                 |
| `20260807030000_p1_types_and_cleanup.sql`  | 类型修正、函数修复       |
| `20260807040000_p2_save_photo_atomically.sql` | 后台专用 RPC（前台无关） |

---

## 一、必须改，否则前台会报错（P0）

### 1. `comment` / `users` 不能再用 `select=*` 读

匿名角色（anon）在这两张表上的 **SELECT 权限被改成了列级白名单**。
`select('*')` 会被 Postgres 拒绝，报 `42501 permission denied for table comment`。

anon **读不到**的列：

- `comment`：`email`、`ip`、`ip_info`、`toxic_score`、`receive_notification`
- `users`：`current_ip`、`source`、`role`、`user_id`

前台所有读这两张表的查询（包括**嵌套关联**，例如 `article.select('*, comment(*)')`
或 `comment.select('*, users(*)')`）都要改成显式列清单。

```ts
// ❌ 会 42501
supabase.from('comment').select('*')
supabase.from('comment').select('*, users(*)')

// ✅
supabase
  .from('comment')
  .select(`
    id, name, website, content_html, content_text, content_json,
    created_at, reply_to, is_anonymous, is_public, is_blocked,
    to_article, to_photo, to_thought,
    users ( id, name, website, created_at )
  `)
```

> 注意：这是**列级 GRANT**，不是 RLS。它对 anon key 生效。
> 如果前台某些请求是以登录用户身份（authenticated）发出的，那些请求不受影响——
> authenticated 保留了全部列权限。但公开页面几乎都走 anon，按 anon 处理。

### 2. 评论列表现在只返回「已审核通过」的评论

旧策略：anon 可以看 `not is_blocked` 的全部评论。
新策略：anon 只能看 **`is_public = true AND is_blocked = false`**。

而数据库里有个既有触发器 `set_comment_is_public`：**`is_anonymous = true` 的评论会被强制
写成 `is_public = false`**。

也就是说：**匿名访客提交的评论，提交后不会立刻出现在列表里，要等后台审核**。

前台需要做的：

- 提交评论成功后，**不要**乐观地把它插进列表当作"已发布"，改成提示
  「评论已提交，审核通过后显示」之类的文案。
- 如果前台有"评论数"，它现在应该只统计 `is_public = true`（数据库也只会返回这些）。

### 3. 匿名提交评论：不要带 `.select()`，字段要合规

**（a）不要 `.select()` 回读。**
`insert().select()` 会在插入后做一次 SELECT，而匿名评论 `is_public = false`，
RLS 把它过滤掉了；而且默认回读是 `*`，又会撞上第 1 条的列权限。

```ts
// ❌ 会抛 PGRST116（0 rows）或 42501
const { data } = await supabase.from('comment').insert(payload).select().single()

// ✅
const { error } = await supabase.from('comment').insert(payload)
```

**（b）anon 的 INSERT 现在有 WITH CHECK 约束**，不满足会被拒绝：

| 要求                                | 说明                              |
| ----------------------------------- | --------------------------------- |
| `user_id` 必须为 `null`             | 匿名评论不得冒充已注册用户        |
| `is_blocked` 必须为 `false` 或不传  | 不能自设绕过屏蔽                  |
| `toxic_score` 必须为 `null` 或不传  | 这个值只能由服务端写              |
| `content_text` 非空且 **≤ 5000 字符** | 前台表单要加同样的长度校验，先在客户端拦下 |

同时表上原有的 CHECK 仍然生效：`is_anonymous = true` 时必须有 `name` 和 `email`。

推荐的匿名评论 payload：

```ts
{
  name, email, website,          // email 必填（表 CHECK 要求）
  is_anonymous: true,
  content_json, content_html, content_text,   // content_text ≤ 5000
  to_article / to_photo / to_thought,
  reply_to
  // 不要传 user_id / is_public / is_blocked / toxic_score / ip / ip_info
}
```

### 4. 用户资料更新：`role` 与 `user_id` 不可改

`users` 表加了 `guard_user_privileges` 触发器：非管理员改自己的 `role` 或 `user_id`
会抛 `42501`。前台如果有"编辑个人资料"，只能提交 `name` / `website`，
**不要**把整个 user 对象回写（那样会带上 `role`，即使值没变……值没变是安全的，
`is distinct from` 只在真的改变时才拦；但最好还是只提交实际要改的字段）。

### 5. 前台不要调用 CMS 的 `/api/*`

CMS 的 `hooks.server.ts` 现在对 `/admin/**` 和所有非 auth 的 `/api/**` 强制要求
**admin 角色**：未登录返回 401 JSON，登录但非管理员返回 403 JSON。
如果前台有任何地方在打 CMS 的 `/api/image`、`/api/r2`、`/api/img-alt`、`/api/slug-check`，
现在会失败，需要改走别的路径。

---

## 二、行为变化，多半不用改代码但要知道

### 6. `gallery_feed` 视图改成了 `security_invoker = on`

现在视图内部按调用者身份走 RLS。已确认对 anon 的可见性没有变化
（photo 仍是 `not is_draft`，thought / image / photo_image 对 anon 全开）。
**前台无需改动**，但以后改这个视图的 WHERE 时不会再静默泄露草稿了。

### 7. `published_at` 现在一定有值

`update_published_time` 触发器从「只挂 UPDATE」改成「INSERT OR UPDATE」。
以前直接 INSERT 一条 `is_draft = false` 的内容，`published_at` 会留 NULL，
于是它掉出部分索引、在按 `published_at` 排序的前台列表里**直接消失**。
现在不会了。前台如果写过 `published_at ?? created_at` 之类的兜底，可以留着，但不再必要。

### 8. `updated_at` 由数据库控制，且访客行为不再污染它

`article` / `photo` 加了 `touch_updated_at` 触发器：
- 客户端传的 `updated_at` 会被覆盖（前台本来也不该写）。
- **`page_view` 自增和 `reactions` 变化不会再改 `updated_at`**。
  以前一个访客点个表情，三年前的文章就会被顶到"最近更新"的最前面。

前台调用 `article_page_view()` / `photo_page_view()` / `add_reaction()` 的地方
**不用改**，行为反而变正确了。

> `thought` 表没有 `updated_at` 列，不受影响。

### 9. `get_article_count_by_year(lang_name)` 不再返回幽灵年份

以前它把草稿（`published_at` 为 NULL）也算进去，归档页会出现一行 `year = null`。
现在加了 `is_draft = false AND published_at IS NOT NULL`。
**前台如果写过过滤 null 年份的补丁代码，可以删掉了。**

### 10. `topic` 查询请用数组包含运算符

`article.topic` 上原来的 B-tree 索引已删除，换成了 **GIN**；`photo.topic` 也新建了 GIN。
GIN 只服务 `@>` / `&&`，用别的写法会退化成全表扫。

```ts
supabase.from('article').select(...).contains('topic', ['摄影'])   // @>
supabase.from('article').select(...).overlaps('topic', ['A', 'B']) // &&
```

### 11. JSON → JSONB

`article.content_json`、`thought.content_json`、`comment.content_json`、
`comment.ip_info`、`image.exif` 从 `json` 转成了 `jsonb`。

对 JS 侧是**透明的**（supabase-js 拿到的仍是解析好的对象）。唯一差别是 jsonb 不保留
键顺序和空白——Tiptap 文档和 EXIF 都不依赖这些。

> `photo.content_json` 可能仍是 `json`：生产库有 `random_{en,jp,zh}_photos`
> 三个视图依赖 photo 的列，转换会被视图挡住，迁移遇到这种情况是跳过并警告，不报错。
> 无论哪种，前台读法一样。

### 12. `users.current_ip`：TEXT → INET

前台读不到这一列（见第 1 条），列出来只是为了类型定义同步。

---

## 三、类型定义要重新生成

CMS 已经改用 `supabase gen types` 生成的 `src/lib/types/database.ts`，
手写的类型守卫全删了。**前台建议做同样的事**：

```bash
pnpm add -D supabase
pnpm exec supabase login
pnpm exec supabase gen types typescript --project-id <project-ref> > src/lib/types/database.ts
```

生成后会看到这些列**从可空变成了非空**（P1 迁移加的 NOT NULL）：

| 表 | 变成 NOT NULL 的列 |
| --- | --- |
| `article` | `title`、`slug`、`lang`、`category`、`updated_at` |
| `photo` | `title`、`slug`、`lang`、`category`、`updated_at` |
| `category` | `lang`、`slug`、`title`、`type` |
| `language` | `lang`、`locale`、`is_default`（默认 `false`） |
| `thought` | `slug` |
| `book` | `title` |
| `message` | `contact_type`（默认 `'email'`） |

对前台是好事：可以删掉一堆 `title ?? ''`、`if (!slug) return` 之类的防御代码。

其他约束：`book.rate` 现在有 `CHECK (rate BETWEEN 1 AND 5)`。

---

## 四、明确**没有**改的东西（不要自作主张跟着改）

- **`photo_image."order"` 列名没改**。曾计划改名 `sort_order` 并加 UNIQUE，
  因为会同时打断 `gallery_feed` 视图和多条写入路径，本轮**故意不做**。前台照旧读 `"order"`。
- **`image.date`（TEXT）还在**，虽然它和 `taken_at`（TIMESTAMPTZ）重复、索引已删除。
  它迟早要被删。**前台现在就该改成读 `taken_at`**，别再依赖 `date`。
- **`image.exif` 对 anon 仍然全字段可读**（含 GPS、相机序列号等）。这是已知的待办项，
  修复方式取决于前台到底展示哪些 EXIF 字段——
  **请告诉 CMS 侧前台实际读了 exif 里的哪些 key**，好据此决定是裁剪列还是建 `image_public` 视图。
- **`random_{en,jp,zh}_photos` 三个视图没有被处理**（它们不在任何迁移文件里，
  是历史遗留）。它们 select 了 `photo.*`，包含 `is_draft`。
  **如果前台在用这几个视图，请自己确认查询里带了 `is_draft = false`。**
- **`message` 表仍然只允许 authenticated 插入**（策略 `Logged Users Can Send Message`）。
  如果前台有公开的联系表单用 anon key 写 `message`，它现在也是失败的（这不是今天引入的）。
  需要的话 CMS 侧可以加一条 anon INSERT 策略，告诉我们即可。

---

## 五、改完后的自检清单

1. 文章页 / 相册页 / thought 页的评论列表能正常显示（且只有已审核的）。
2. 匿名提交一条评论 → 不报错，页面提示"待审核"，列表里暂不出现。
3. 去 CMS 后台 `/admin/comment/1` 通过审核 → 刷新前台，评论出现。
4. 全站搜索代码里的 `.select('*')`，确认没有一个是打在 `comment` 或 `users` 上的
   （包括嵌套 `comment(*)` / `users(*)`）。
5. 归档页的年份列表里没有 `null` 年份。
6. 按 topic 筛选的页面仍然出结果。
7. 文章/相册列表的排序没有因为访客点表情而乱掉。
