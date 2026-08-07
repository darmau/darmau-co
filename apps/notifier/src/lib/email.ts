import type { Env } from '../env';

export interface OutgoingMail {
	to: string;
	subject: string;
	html: string;
	text?: string;
}

/**
 * 唯一的发信出口。
 *
 * 目前走 Cloudflare Email Service 的 `send_email` binding。之所以把它单独抽出来，
 * 是因为 Cloudflare 官方文档对"能不能发给任意未验证收件人"两处说法不一致
 * （Get started 页直接发给任意地址，send binding 页却提到 allowed_destination_addresses
 * 和 E_RECIPIENT_NOT_ALLOWED）。评论通知必须能发给任意访客邮箱，所以上线前要实测；
 * 万一发不出去，只需要换掉这个文件的实现，其余代码不用动。
 */
export async function sendEmail(env: Env, mail: OutgoingMail): Promise<string> {
	if (!env.EMAIL) throw new Error('缺少 EMAIL binding，检查 wrangler.jsonc 的 send_email 配置');
	if (!env.MAIL_FROM) throw new Error('缺少 MAIL_FROM');

	const { messageId } = await env.EMAIL.send({
		to: mail.to,
		from: env.MAIL_FROM,
		subject: mail.subject,
		html: mail.html,
		text: mail.text
	});

	return messageId;
}
