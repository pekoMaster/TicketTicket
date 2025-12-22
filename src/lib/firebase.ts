import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase 設定
const firebaseConfig = {
  apiKey: "AIzaSyBjMDzT-kTxHjjQZZH0f9IJ49TDr_Ap3NE",
  authDomain: "ticketticket-be114.firebaseapp.com",
  projectId: "ticketticket-be114",
  storageBucket: "ticketticket-be114.firebasestorage.app",
  messagingSenderId: "445867774154",
  appId: "1:445867774154:web:0a10b6ec34a0e876c5a433",
  measurementId: "G-E0TWZBSNDC"
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
