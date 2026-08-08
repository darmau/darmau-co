<script lang="ts">
	import { enhance } from '$app/forms';
	import BellIcon from '$icons/Bell.svelte';
	import BellSlashIcon from '$icons/BellSlash.svelte';
	import TrashIcon from '$icons/Trash.svelte';
	import XCircleIcon from '$icons/XCircle.svelte';
	import { focusOnMount } from '$lib/actions/focusOnMount';
	import ProfileText from '$lib/locales/profile';
	import getLanguageLabel from '$lib/utils/getLanguageLabel';
	import getTime from '$lib/utils/getTime';
	import type { CommentWithContent } from './+page.server';
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	const lang = $derived(data.lang);
	const label = $derived(getLanguageLabel(ProfileText, lang));

	// 旧版 CommentItem 组件里的 useState；每条评论各自一份，所以按 id 存
	let showDeleteConfirm = $state<Record<number, boolean>>({});
	// 记住刚取消确认的那条，好把焦点还给它的删除按钮
	let cancelledId = $state<number | null>(null);

	// 确定内容类型和链接（旧版还算了个 contentType，但从没用到，这里略去）
	function contentOf(comment: CommentWithContent) {
		if (comment.article) {
			return {
				title: comment.article.title,
				link: `/${lang}/article/${comment.article.slug}#comment-${comment.id}`
			};
		}
		if (comment.photo) {
			return {
				title: comment.photo.title,
				link: `/${lang}/album/${comment.photo.slug}#comment-${comment.id}`
			};
		}
		if (comment.thought) {
			return {
				title: comment.thought.content_text.slice(0, 30) + '...',
				link: `/${lang}/thought/${comment.thought.slug}#comment-${comment.id}`
			};
		}
		return { title: '', link: '' };
	}
</script>

<svelte:head>
	<title>{label.my_profile} - {data.userProfile.name || 'User'}</title>
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

{#if !data.isOwnProfile}
	<!-- load 里非本人已经 error(403) 了，和旧版一样这个分支不会命中，保留以求 1:1 -->
	<div class="min-h-screen bg-zinc-50 flex items-center justify-center px-4 py-12">
		<div class="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
			<XCircleIcon class="h-12 w-12 text-red-500 mx-auto mb-4" />
			<h1 class="text-2xl font-bold text-zinc-900 mb-2">{label.unauthorized}</h1>
			<p class="text-zinc-600 mb-6">{label.unauthorized_desc}</p>
			<a
				href="/{lang}"
				class="inline-block px-4 py-2 bg-violet-600 text-white rounded-md hover:bg-violet-700 transition-colors"
			>
				{label.go_home}
			</a>
		</div>
	</div>
{:else}
	<div class="min-h-screen bg-zinc-50 py-8 px-4 sm:px-6 lg:px-8">
		<div class="max-w-7xl mx-auto">
			<!-- 这个分支原来只有两个 h2，整页没有 h1，读屏用户拿不到页面主题 -->
			<h1 class="sr-only">{label.my_profile}</h1>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<!-- 左侧 - 评论列表 -->
				<div class="lg:col-span-2 space-y-6">
					<h2 class="text-2xl font-bold text-zinc-900">{label.my_comments}</h2>

					<!-- 操作反馈。删除/切换通知都走 use:enhance，没有页面跳转，
						 容器常驻 DOM 并声明 live region 角色，读屏才能知道操作结果 -->
					<div role="status">
						{#if form?.success}
							<div class="p-4 bg-green-50 border border-green-200 rounded-md">
								<p class="text-sm text-green-700">{form.success}</p>
							</div>
						{/if}
					</div>
					<div role="alert">
						{#if form?.error}
							<div class="p-4 bg-red-50 border border-red-200 rounded-md">
								<p class="text-sm text-red-700">{form.error}</p>
							</div>
						{/if}
					</div>

					<!-- 评论列表 -->
					{#if data.comments.length === 0}
						<div class="bg-white rounded-lg shadow-sm border border-zinc-200 p-12 text-center">
							<p class="text-zinc-500">{label.no_comments}</p>
						</div>
					{:else}
						<div class="space-y-4">
							{#each data.comments as comment (comment.id)}
								{@const content = contentOf(comment)}
								<div
									class="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 hover:shadow-md transition-shadow"
								>
									<!-- 内容标题 -->
									<div class="mb-3">
										<a
											href={content.link}
											class="text-lg font-medium text-violet-700 hover:text-violet-800 hover:underline"
										>
											{content.title}
										</a>
									</div>

									<!-- 回复的评论 -->
									{#if comment.reply_to}
										<div class="mb-3 pl-4 border-l-2 border-zinc-200">
											<p class="text-sm text-zinc-500 mb-1">{label.replied_to}:</p>
											<p class="text-sm text-zinc-600 line-clamp-2">
												{comment.reply_to.content_text}
											</p>
										</div>
									{/if}

									<!-- 评论内容 -->
									<div class="mb-3">
										<p class="text-zinc-700 whitespace-pre-wrap">{comment.content_text}</p>
									</div>

									<!-- 底部信息和操作 -->
									<div class="flex items-center justify-between pt-3 border-t border-zinc-100">
										<time class="text-sm text-zinc-500">
											{getTime(comment.created_at, lang)}
										</time>

										<div class="flex items-center gap-2">
											<!-- 通知切换按钮 -->
											<form method="POST" action="?/toggleNotification" class="inline" use:enhance>
												<input type="hidden" name="commentId" value={comment.id} />
												<input
													type="hidden"
													name="currentValue"
													value={String(comment.receive_notification)}
												/>
												<!-- 图标本身是 aria-hidden，只靠 title 兜底，而且开/关共用一句文案，
													 读屏无法判断当前状态。改成随状态变化的可访问名 + aria-pressed -->
												<button
													type="submit"
													aria-pressed={comment.receive_notification}
													title={comment.receive_notification
														? label.notification_on
														: label.notification_off}
													class="p-2 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600 {comment.receive_notification
														? 'text-violet-600 hover:bg-violet-50'
														: 'text-zinc-500 hover:bg-zinc-100'}"
												>
													{#if comment.receive_notification}
														<BellIcon class="h-5 w-5" />
													{:else}
														<BellSlashIcon class="h-5 w-5" />
													{/if}
													<span class="sr-only">
														{comment.receive_notification
															? label.notification_on
															: label.notification_off}
													</span>
												</button>
											</form>

											<!-- 删除按钮 -->
											{#if !showDeleteConfirm[comment.id]}
												<!-- 只有图标的按钮，图标组件是 aria-hidden，必须补 sr-only 文字，
													 否则读屏只会报「按钮」。type 也要写死，免得被当成提交按钮 -->
												<button
													type="button"
													onclick={() => (showDeleteConfirm[comment.id] = true)}
													use:focusOnMount={cancelledId === comment.id}
													title={label.delete}
													class="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
												>
													<TrashIcon class="h-5 w-5" />
													<span class="sr-only">{label.delete}</span>
												</button>
											{:else}
												<!-- 确认问句原本是按钮自己的文字，按钮名应该是动作而不是问题；
													 焦点也要跟着走，否则触发按钮消失后键盘用户会掉回页面顶部 -->
												<div class="flex flex-wrap items-center justify-end gap-2">
													<span class="text-sm text-zinc-600">{label.delete_confirm}</span>
													<form method="POST" action="?/delete" class="inline" use:enhance>
														<input type="hidden" name="commentId" value={comment.id} />
														<button
															type="submit"
															use:focusOnMount
															class="px-3 py-1 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
														>
															{label.delete}
														</button>
													</form>
													<button
														type="button"
														onclick={() => {
															showDeleteConfirm[comment.id] = false;
															cancelledId = comment.id;
														}}
														title={label.cancel}
														class="p-1 text-zinc-500 hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
													>
														<XCircleIcon class="h-5 w-5" />
														<span class="sr-only">{label.cancel}</span>
													</button>
												</div>
											{/if}
										</div>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- 右侧 - 用户信息 -->
				<div class="lg:col-span-1">
					<div class="bg-white rounded-lg shadow-sm border border-zinc-200 p-6 sticky top-8">
						<h2 class="text-xl font-bold text-zinc-900 mb-6">{label.user_info}</h2>

						<!-- 用户信息。旧版这几行字段名用的是 <label>，但没有关联任何表单控件，
							 会触发 a11y 警告，这里换成 <span>，class 和渲染效果不变。 -->
						<div class="space-y-4">
							<div>
								<span class="text-sm font-medium text-zinc-500">{label.user_info}</span>
								<p class="text-base text-zinc-900 mt-1">
									{data.userProfile.name || label.not_set}
								</p>
							</div>

							<div>
								<span class="text-sm font-medium text-zinc-500">Email</span>
								<p class="text-base text-zinc-900 mt-1 break-all">{data.userProfile.email}</p>
							</div>

							<div>
								<span class="text-sm font-medium text-zinc-500">{label.my_comments}</span>
								<p class="text-base text-zinc-900 mt-1">{data.comments.length}</p>
							</div>

							{#if data.userProfile.created_at}
								<div>
									<span class="text-sm font-medium text-zinc-500">{label.registered_at}</span>
									<p class="text-base text-zinc-900 mt-1">
										{getTime(data.userProfile.created_at, lang)}
									</p>
								</div>
							{/if}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
