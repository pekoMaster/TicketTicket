import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase 設定 - 使用環境變數
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// 初始化 Firebase（避免重複初始化）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

// 設定語言（跟隨瀏覽器）
auth.useDeviceLanguage();

// reCAPTCHA 驗證器實例
let recaptchaVerifier: RecaptchaVerifier | null = null;
let recaptchaWidgetId: number | null = null;

/**
 * 初始化 reCAPTCHA 驗證器
 */
export function initRecaptcha(containerId: string): RecaptchaVerifier {
  // 如果已經有實例且還有效，直接返回
  if (recaptchaVerifier) {
    return recaptchaVerifier;
  }

  // 清理舊的 reCAPTCHA widget（如果存在）
  const container = document.getElementById(containerId);
  if (container) {
    container.innerHTML = '';
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      console.log('reCAPTCHA expired');
      // 過期時重置
      recaptchaVerifier = null;
    }
  });

  return recaptchaVerifier;
}

/**
 * 發送手機驗證碼
 */
export async function sendPhoneVerificationCode(
  phoneNumber: string,
  recaptcha: RecaptchaVerifier
): Promise<ConfirmationResult> {
  return signInWithPhoneNumber(auth, phoneNumber, recaptcha);
}

/**
 * 清除 reCAPTCHA
 */
export function clearRecaptcha(): void {
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (e) {
      console.log('reCAPTCHA clear error (ignored):', e);
    }
    recaptchaVerifier = null;
  }
  recaptchaWidgetId = null;

  // 清理 DOM 中的 reCAPTCHA 元素
  const container = document.getElementById('recaptcha-container');
  if (container) {
    container.innerHTML = '';
  }
}

export { auth, RecaptchaVerifier };
export type { ConfirmationResult };
