export class ThirdPartyAPIs {
	private readonly apiNames: Map<string, string> = new Map([
		['config_UNSPLASH_ACCESS_KEY', ''],
		['config_UNSPLASH_SECRET_KEY', ''],
		['config_MAPBOX', ''],
		['config_AMAP', ''],
		['config_URL_PREFIX', ''],
		// 邮件发送已经从 Resend 换成 Cloudflare Email Service（apps/notifier），
		// 密钥走 Worker 的 binding，不再存进 config 表
		['config_BARK_SERVER', '']
	]);

	public array() {
		return Array.from(this.apiNames.keys());
	}

	public emptyObject() {
		return Object.fromEntries(this.apiNames);
	}
}
