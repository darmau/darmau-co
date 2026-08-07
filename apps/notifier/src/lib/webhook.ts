/** Supabase Database Webhook / pg_net 触发器发过来的 payload 形状。 */
export interface WebhookPayload<T = Record<string, unknown>> {
	type?: 'INSERT' | 'UPDATE' | 'DELETE';
	table?: string;
	schema?: string;
	record?: T | null;
	old_record?: T | null;
}
