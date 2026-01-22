import { Resend } from 'resend';

// 延遲初始化 Resend（需要在 .env 設定 RESEND_API_KEY）
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// 網站基礎 URL
const BASE_URL = process.env.NEXTAUTH_URL || 'https://ticketticket.live';

// 品牌顏色
const BRAND_COLORS = {
  primary: '#6366f1',      // indigo-500
  primaryDark: '#4f46e5',  // indigo-600
  background: '#f8fafc',   // slate-50
  text: '#1e293b',         // slate-800
  textLight: '#64748b',    // slate-500
  border: '#e2e8f0',       // slate-200
};

// 支援的語言類型
type SupportedLocale = 'zh-TW' | 'zh-CN' | 'ja' | 'en';

// 郵件翻譯內容
const EMAIL_I18N: Record<SupportedLocale, {
  subject: string;
  title: string;
  subtitle: string;
  greeting: (name: string) => string;
  body: string;
  buttonText: string;
  copyHint: string;
  warning: string;
  footerText: string;
  footerContact: string;
}> = {
  'zh-TW': {
    subject: '驗證您的 Email - TicketTicket',
    title: '驗證您的 Email',
    subtitle: 'HOLO 票券媒合平台',
    greeting: (name: string) => `嗨，${name}！`,
    body: '感謝您註冊 TicketTicket！請點擊下方按鈕驗證您的 Email 地址，完成後即可開始申請同行夥伴。',
    buttonText: '驗證 Email',
    copyHint: '或複製以下連結到瀏覽器：',
    warning: '注意：此驗證連結將在 24 小時後失效。如果您沒有註冊 TicketTicket，請忽略此郵件。',
    footerText: '這封郵件由 TicketTicket 自動發送',
    footerContact: '如有任何問題，請聯繫我們的客服團隊',
  },
  'zh-CN': {
    subject: '验证您的 Email - TicketTicket',
    title: '验证您的 Email',
    subtitle: 'HOLO 票券媒合平台',
    greeting: (name: string) => `嗨，${name}！`,
    body: '感谢您注册 TicketTicket！请点击下方按钮验证您的 Email 地址，完成后即可开始申请同行伙伴。',
    buttonText: '验证 Email',
    copyHint: '或复制以下链接到浏览器：',
    warning: '注意：此验证链接将在 24 小时后失效。如果您没有注册 TicketTicket，请忽略此邮件。',
    footerText: '这封邮件由 TicketTicket 自动发送',
    footerContact: '如有任何问题，请联系我们的客服团队',
  },
  'ja': {
    subject: 'メールアドレスの確認 - TicketTicket',
    title: 'メールアドレスを確認',
    subtitle: 'HOLO チケットマッチングプラットフォーム',
    greeting: (name: string) => `こんにちは、${name} さん！`,
    body: 'TicketTicket へのご登録ありがとうございます！下のボタンをクリックしてメールアドレスを確認してください。確認後、同行者の募集に参加できます。',
    buttonText: 'メールを確認',
    copyHint: 'または以下のリンクをブラウザにコピーしてください：',
    warning: '注意：この確認リンクは 24 時間後に期限切れとなります。TicketTicket に登録した覚えがない場合は、このメールを無視してください。',
    footerText: 'このメールは TicketTicket から自動送信されました',
    footerContact: 'ご質問がある場合は、サポートチームにお問い合わせください',
  },
  'en': {
    subject: 'Verify Your Email - TicketTicket',
    title: 'Verify Your Email',
    subtitle: 'HOLO Ticket Matching Platform',
    greeting: (name: string) => `Hi ${name}!`,
    body: 'Thank you for registering on TicketTicket! Please click the button below to verify your email address. Once verified, you can start applying for companions.',
    buttonText: 'Verify Email',
    copyHint: 'Or copy this link to your browser:',
    warning: 'Note: This verification link will expire in 24 hours. If you did not register for TicketTicket, please ignore this email.',
    footerText: 'This email was sent automatically by TicketTicket',
    footerContact: 'If you have any questions, please contact our support team',
  },
};

// 根據 locale 獲取翻譯，預設為 zh-TW
function getEmailTranslations(locale: string) {
  const supportedLocale = (['zh-TW', 'zh-CN', 'ja', 'en'].includes(locale)
    ? locale
    : 'zh-TW') as SupportedLocale;
  return EMAIL_I18N[supportedLocale];
}

/**
 * Email 驗證信模板（多語言版本）
 */
function getVerificationEmailHtml(username: string, verificationLink: string, locale: string): string {
  const t = getEmailTranslations(locale);
  const htmlLang = locale === 'ja' ? 'ja' : locale.startsWith('zh') ? 'zh' : 'en';

  return `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid ${BRAND_COLORS.border};">
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark}); border-radius: 12px;">
                <span style="font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">
                  TicketTicket
                </span>
              </div>
              <p style="margin: 16px 0 0; font-size: 14px; color: ${BRAND_COLORS.textLight};">
                ${t.subtitle}
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: ${BRAND_COLORS.text}; text-align: center;">
                ${t.title}
              </h1>

              <p style="margin: 0 0 16px; font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.text};">
                ${t.greeting(username)}
              </p>

              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.text};">
                ${t.body}
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${verificationLink}"
                       style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark}); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 24px 0 16px; font-size: 14px; line-height: 1.6; color: ${BRAND_COLORS.textLight};">
                ${t.copyHint}
              </p>

              <p style="margin: 0 0 24px; padding: 12px 16px; background-color: ${BRAND_COLORS.background}; border-radius: 8px; font-size: 12px; word-break: break-all; color: ${BRAND_COLORS.primary};">
                ${verificationLink}
              </p>

              <div style="margin: 32px 0 0; padding: 20px; background-color: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #92400e;">
                  ${t.warning}
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND_COLORS.background}; border-top: 1px solid ${BRAND_COLORS.border}; border-radius: 0 0 16px 16px;">
              <p style="margin: 0 0 8px; font-size: 14px; color: ${BRAND_COLORS.textLight}; text-align: center;">
                ${t.footerText}
              </p>
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textLight}; text-align: center;">
                ${t.footerContact}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Email 驗證信純文字版本（多語言版本）
 */
function getVerificationEmailText(username: string, verificationLink: string, locale: string): string {
  const t = getEmailTranslations(locale);

  return `
${t.greeting(username)}

${t.body}

${verificationLink}

${t.warning}

---
TicketTicket - ${t.subtitle}
  `.trim();
}

/**
 * 發送 Email 驗證信（支援多語言）
 */
export async function sendVerificationEmail(
  to: string,
  username: string,
  token: string,
  locale: string = 'zh-TW'
): Promise<{ success: boolean; error?: string }> {
  const verificationLink = `${BASE_URL}/api/auth/verify-email?token=${token}`;
  const t = getEmailTranslations(locale);

  try {
    // 如需自訂網域，需在 Resend 控制台驗證網域
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'TicketTicket <onboarding@resend.dev>';

    const { error } = await getResend().emails.send({
      from: fromEmail,
      to: [to],
      subject: t.subject,
      html: getVerificationEmailHtml(username, verificationLink, locale),
      text: getVerificationEmailText(username, verificationLink, locale),
    });

    if (error) {
      console.error('Resend error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send verification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 產生驗證 token（32 字元隨機字串）
 */
export function generateVerificationToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * 取得 token 過期時間（24 小時後）
 */
export function getTokenExpiration(): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration;
}

// ===== 通知郵件系統 =====

type NotificationType = 'new_message' | 'new_application' | 'application_accepted' | 'application_rejected';

interface NotificationEmailData {
  eventName: string;
  senderName?: string;
  messagePreview?: string;
  listingId?: string;
  conversationId?: string;
}

const NOTIFICATION_I18N: Record<SupportedLocale, Record<NotificationType, {
  subject: (data: NotificationEmailData) => string;
  title: string;
  body: (data: NotificationEmailData) => string;
  buttonText: string;
}>> = {
  'zh-TW': {
    new_message: {
      subject: (d) => `新訊息：${d.senderName} 詢問「${d.eventName}」`,
      title: '您收到新訊息',
      body: (d) => `${d.senderName} 對您的「${d.eventName}」刊登發送了訊息${d.messagePreview ? `：\n「${d.messagePreview}」` : ''}`,
      buttonText: '查看對話',
    },
    new_application: {
      subject: (d) => `新申請：有人申請「${d.eventName}」同行`,
      title: '有人申請加入',
      body: (d) => `${d.senderName} 申請加入您的「${d.eventName}」同行！請盡快回覆。`,
      buttonText: '查看申請',
    },
    application_accepted: {
      subject: (d) => `恭喜！您的「${d.eventName}」申請已被接受`,
      title: '申請已接受',
      body: (d) => `恭喜！您對「${d.eventName}」的同行申請已被主辦方接受。請前往對話確認。`,
      buttonText: '查看詳情',
    },
    application_rejected: {
      subject: (d) => `「${d.eventName}」申請結果通知`,
      title: '申請未通過',
      body: (d) => `很抱歉，您對「${d.eventName}」的同行申請未被選中。祝您下次好運！`,
      buttonText: '繼續尋找',
    },
  },
  'zh-CN': {
    new_message: {
      subject: (d) => `新消息：${d.senderName} 询问「${d.eventName}」`,
      title: '您收到新消息',
      body: (d) => `${d.senderName} 对您的「${d.eventName}」发送了消息${d.messagePreview ? `：\n「${d.messagePreview}」` : ''}`,
      buttonText: '查看对话',
    },
    new_application: {
      subject: (d) => `新申请：有人申请「${d.eventName}」同行`,
      title: '有人申请加入',
      body: (d) => `${d.senderName} 申请加入您的「${d.eventName}」同行！请尽快回复。`,
      buttonText: '查看申请',
    },
    application_accepted: {
      subject: (d) => `恭喜！您的「${d.eventName}」申请已被接受`,
      title: '申请已接受',
      body: (d) => `恭喜！您对「${d.eventName}」的同行申请已被主办方接受。请前往对话确认。`,
      buttonText: '查看详情',
    },
    application_rejected: {
      subject: (d) => `「${d.eventName}」申请结果通知`,
      title: '申请未通过',
      body: (d) => `很抱歉，您对「${d.eventName}」的同行申请未被选中。祝您下次好运！`,
      buttonText: '继续寻找',
    },
  },
  'ja': {
    new_message: {
      subject: (d) => `新規メッセージ：${d.senderName}さんから「${d.eventName}」について`,
      title: '新規メッセージ',
      body: (d) => `${d.senderName}さんが「${d.eventName}」についてメッセージを送信しました${d.messagePreview ? `：\n「${d.messagePreview}」` : ''}`,
      buttonText: '会話を見る',
    },
    new_application: {
      subject: (d) => `新規申請：「${d.eventName}」への同行申請`,
      title: '同行申請が届きました',
      body: (d) => `${d.senderName}さんが「${d.eventName}」への同行を申請しました！ご確認ください。`,
      buttonText: '申請を確認',
    },
    application_accepted: {
      subject: (d) => `おめでとう！「${d.eventName}」の申請が承認されました`,
      title: '申請が承認されました',
      body: (d) => `おめでとうございます！「${d.eventName}」への同行申請が承認されました。会話で確認してください。`,
      buttonText: '詳細を見る',
    },
    application_rejected: {
      subject: (d) => `「${d.eventName}」申請結果のお知らせ`,
      title: '申請が選ばれませんでした',
      body: (d) => `残念ながら、「${d.eventName}」への同行申請は選ばれませんでした。次回のご応募をお待ちしています！`,
      buttonText: '他を探す',
    },
  },
  'en': {
    new_message: {
      subject: (d) => `New message: ${d.senderName} asked about "${d.eventName}"`,
      title: 'You have a new message',
      body: (d) => `${d.senderName} sent you a message about "${d.eventName}"${d.messagePreview ? `:\n"${d.messagePreview}"` : ''}`,
      buttonText: 'View Conversation',
    },
    new_application: {
      subject: (d) => `New application for "${d.eventName}"`,
      title: 'New companion request',
      body: (d) => `${d.senderName} has applied to join your "${d.eventName}" listing! Please review their application.`,
      buttonText: 'View Application',
    },
    application_accepted: {
      subject: (d) => `Congratulations! Your "${d.eventName}" application was accepted`,
      title: 'Application Accepted',
      body: (d) => `Great news! Your companion application for "${d.eventName}" has been accepted. Check the conversation to confirm.`,
      buttonText: 'View Details',
    },
    application_rejected: {
      subject: (d) => `"${d.eventName}" application result`,
      title: 'Application Not Selected',
      body: (d) => `Unfortunately, your application for "${d.eventName}" was not selected this time. Good luck with future applications!`,
      buttonText: 'Keep Looking',
    },
  },
};

function getNotificationTranslations(locale: string, type: NotificationType) {
  const supportedLocale = (['zh-TW', 'zh-CN', 'ja', 'en'].includes(locale) ? locale : 'zh-TW') as SupportedLocale;
  return NOTIFICATION_I18N[supportedLocale][type];
}

function getNotificationEmailHtml(
  type: NotificationType,
  data: NotificationEmailData,
  actionUrl: string,
  locale: string
): string {
  const t = getNotificationTranslations(locale, type);
  const htmlLang = locale === 'ja' ? 'ja' : locale.startsWith('zh') ? 'zh' : 'en';

  return `
<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject(data)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: ${BRAND_COLORS.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center; border-bottom: 1px solid ${BRAND_COLORS.border};">
              <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark}); border-radius: 12px;">
                <span style="font-size: 24px; font-weight: 700; color: #ffffff;">TicketTicket</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px;">
              <h1 style="margin: 0 0 24px; font-size: 24px; font-weight: 600; color: ${BRAND_COLORS.text}; text-align: center;">
                ${t.title}
              </h1>
              <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: ${BRAND_COLORS.text}; white-space: pre-line;">
                ${t.body(data)}
              </p>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 16px 0;">
                    <a href="${actionUrl}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, ${BRAND_COLORS.primary}, ${BRAND_COLORS.primaryDark}); color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.4);">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: ${BRAND_COLORS.background}; border-top: 1px solid ${BRAND_COLORS.border}; border-radius: 0 0 16px 16px;">
              <p style="margin: 0; font-size: 12px; color: ${BRAND_COLORS.textLight}; text-align: center;">
                TicketTicket - HOLO Ticket Matching Platform
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * 發送通知郵件（新訊息、新申請、被接受/拒絕）
 */
export async function sendNotificationEmail(
  to: string,
  type: NotificationType,
  data: NotificationEmailData,
  locale: string = 'zh-TW'
): Promise<{ success: boolean; error?: string }> {
  const t = getNotificationTranslations(locale, type);

  // 根據類型決定連結
  let actionUrl = BASE_URL;
  if (data.conversationId) {
    actionUrl = `${BASE_URL}/chat/${data.conversationId}`;
  } else if (data.listingId) {
    actionUrl = `${BASE_URL}/listing/${data.listingId}`;
  } else {
    actionUrl = `${BASE_URL}/messages`;
  }

  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'TicketTicket <onboarding@resend.dev>';

    const { error } = await getResend().emails.send({
      from: fromEmail,
      to: [to],
      subject: t.subject(data),
      html: getNotificationEmailHtml(type, data, actionUrl, locale),
    });

    if (error) {
      console.error('Resend notification error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send notification email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * 發送訂閱通知郵件（當有符合條件的新刊登時）
 */
export async function sendSubscriptionEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'TicketTicket <onboarding@resend.dev>';

    const { error } = await getResend().emails.send({
      from: fromEmail,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error('Resend subscription email error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to send subscription email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
