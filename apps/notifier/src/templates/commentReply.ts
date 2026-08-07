export interface CommentReplyMailInput {
	/** 收件人（被回复的那条评论的作者）名字 */
	name: string;
	lang: string;
	/** 内容在前台的路径段：article / album / thought */
	urlType: string;
	slug: string;
	title: string;
	originalComment: string;
	newComment: string;
	siteUrl: string;
	unsubscribeToken: string;
}

/** 邮件正文里的用户内容一律转义——content_text 是访客可控的。 */
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

export function renderCommentReplyMail(input: CommentReplyMailInput): {
	html: string;
	text: string;
} {
	const contentUrl = `${input.siteUrl}/${input.lang}/${input.urlType}/${input.slug}`;
	const unsubscribeUrl = `${input.siteUrl}/${input.lang}/unsubscribe?token=${encodeURIComponent(input.unsubscribeToken)}`;

	const name = escapeHtml(input.name);
	const title = escapeHtml(input.title);
	const newComment = escapeHtml(input.newComment);
	const originalComment = escapeHtml(input.originalComment);

	const html = `<!DOCTYPE html>
<html lang="${escapeHtml(input.lang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .greeting {
      font-size: 16px;
      margin-bottom: 20px;
    }
    .content-link {
      color: #0066cc;
      text-decoration: none;
      font-weight: 500;
    }
    .content-link:hover {
      text-decoration: underline;
    }
    .comment-box {
      background-color: #f8f9fa;
      border-left: 4px solid #0066cc;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .original-comment {
      background-color: #f8f9fa;
      border-left: 4px solid #6c757d;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      font-size: 14px;
      color: #6c757d;
    }
    .unsubscribe-link {
      color: #6c757d;
      text-decoration: none;
    }
    .unsubscribe-link:hover {
      color: #495057;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <p class="greeting">你好，${name}，</p>

    <p>你在 <a href="${contentUrl}" class="content-link">${title}</a> 中发布的评论收到了一条新的回复：</p>

    <div class="comment-box">
      <div class="label">新回复</div>
      <div>${newComment}</div>
    </div>

    <div class="original-comment">
      <div class="label">你的原始评论</div>
      <div>${originalComment}</div>
    </div>

    <div class="footer">
      <p>如果你不想再收到此内容的评论通知，可以 <a href="${unsubscribeUrl}" class="unsubscribe-link">取消订阅</a>。</p>
    </div>
  </div>
</body>
</html>`;

	const text = [
		`你好，${input.name}，`,
		'',
		`你在《${input.title}》中发布的评论收到了一条新的回复：`,
		'',
		`新回复：${input.newComment}`,
		'',
		`你的原始评论：${input.originalComment}`,
		'',
		`查看：${contentUrl}`,
		`取消订阅：${unsubscribeUrl}`
	].join('\n');

	return { html, text };
}
