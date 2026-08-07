/**
 * Cloudflare Email Service 的 send binding。
 *
 * `@cloudflare/workers-types` 目前还没有把 Email Service 的对象式 `send()`
 * 纳进来（它只有旧的 Email Routing `EmailMessage`），所以这里自己声明一份。
 * 契约见 https://developers.cloudflare.com/email-service/api/send-emails/workers-api/
 */
export interface SendEmailBinding {
	send(message: {
		to: string | string[];
		from: string;
		subject: string;
		html?: string;
		text?: string;
		replyTo?: string;
	}): Promise<{ messageId: string }>;
}

export interface Env {
	/** Supabase 项目 URL，例如 https://xxxx.supabase.co */
	SUPABASE_URL: string;
	/** service role key —— 绕过 RLS，只在这个 Worker 内部使用 */
	SUPABASE_SERVICE_ROLE_KEY: string;
	/** 退订 JWT 的签名密钥，必须和 apps/web 的同名 secret 一致 */
	UNSUBSCRIBE_KEY: string;
	/** Supabase（触发器 / Database Webhook）调用本 Worker 时的 Bearer token */
	WEBHOOK_SECRET: string;
	/** 前台站点地址，用来拼邮件里的内容链接和退订链接 */
	SITE_URL: string;
	/** 发件地址，域名需已 onboard 到 Cloudflare Email Service */
	MAIL_FROM: string;
	EMAIL: SendEmailBinding;
}
