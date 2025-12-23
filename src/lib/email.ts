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
  const verificationLink = `${BASE_URL}/verify-email?token=${token}`;
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
