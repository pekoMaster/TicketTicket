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

/**
 * 初始化 reCAPTCHA 驗證器
 */
export function initRecaptcha(containerId: string): RecaptchaVerifier {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
  }

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA 驗證成功
      console.log('reCAPTCHA verified');
    },
    'expired-callback': () => {
      // reCAPTCHA 過期
      console.log('reCAPTCHA expired');
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
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
}

export { auth, RecaptchaVerifier };
export type { ConfirmationResult };
