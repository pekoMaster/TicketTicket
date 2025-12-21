import * as deepl from 'deepl-node';
import translate from 'google-translate-api-x';

// DeepL 支援的語言對應
const DEEPL_LANG_MAP: Record<string, deepl.TargetLanguageCode> = {
    'en': 'en-US',
    'ja': 'ja',
    'zh-TW': 'zh',
    'zh-CN': 'zh',
};

// Google Translate 語言對應
const GOOGLE_LANG_MAP: Record<string, string> = {
    'en': 'en',
    'ja': 'ja',
    'zh-TW': 'zh-TW',
    'zh-CN': 'zh-CN',
};

interface TranslationResult {
    text: string;
    detectedSourceLang?: string;
    provider: 'deepl' | 'google';
}

class TranslationService {
    private deeplClient: deepl.Translator | null = null;
    private deeplAvailable = true;

    constructor() {
        const apiKey = process.env.DEEPL_API_KEY;
        if (apiKey) {
            try {
                this.deeplClient = new deepl.Translator(apiKey);
            } catch (error) {
                console.error('Failed to initialize DeepL client:', error);
                this.deeplAvailable = false;
            }
        } else {
            console.warn('DEEPL_API_KEY not set, will use Google Translate only');
            this.deeplAvailable = false;
        }
    }

    /**
     * 翻譯文字
     * @param text 要翻譯的文字
     * @param targetLang 目標語言 (en, ja, zh-TW, zh-CN)
     */
    async translate(text: string, targetLang: string): Promise<TranslationResult> {
        let result: TranslationResult;

        // 嘗試使用 DeepL
        if (this.deeplAvailable && this.deeplClient) {
            try {
                result = await this.translateWithDeepL(text, targetLang);
            } catch (error) {
                // 檢查是否是額度用完
                if (this.isQuotaExceeded(error)) {
                    console.warn('DeepL quota exceeded, switching to Google Translate');
                    this.deeplAvailable = false;
                } else {
                    console.error('DeepL translation error:', error);
                }
                // 降級到 Google Translate
                result = await this.translateWithGoogle(text, targetLang);
            }
        } else {
            // 使用 Google Translate 作為備用
            result = await this.translateWithGoogle(text, targetLang);
        }

        // 驗證翻譯結果：如果目標語言是中文，但結果主要是拉丁字母，保留原文
        if ((targetLang === 'zh-TW' || targetLang === 'zh-CN') && this.isMostlyLatin(result.text) && !this.isMostlyLatin(text)) {
            return {
                text: text, // 保留原文
                detectedSourceLang: result.detectedSourceLang,
                provider: result.provider,
            };
        }

        return result;
    }

    /**
     * 檢查文字是否主要是拉丁字母
     */
    private isMostlyLatin(text: string): boolean {
        const cleanText = text.replace(/[\s\d\p{P}]/gu, ''); // 移除空白、數字、標點
        if (cleanText.length === 0) return false;
        const latinCount = (cleanText.match(/[a-zA-ZāēīōūĀĒĪŌŪ]/g) || []).length;
        return latinCount / cleanText.length > 0.5; // 超過 50% 是拉丁字母
    }

    private async translateWithDeepL(text: string, targetLang: string): Promise<TranslationResult> {
        if (!this.deeplClient) {
            throw new Error('DeepL client not initialized');
        }

        const deeplTargetLang = DEEPL_LANG_MAP[targetLang] || 'en-US';

        const result = await this.deeplClient.translateText(
            text,
            null, // 自動偵測來源語言
            deeplTargetLang as deepl.TargetLanguageCode
        );

        return {
            text: result.text,
            detectedSourceLang: result.detectedSourceLang,
            provider: 'deepl',
        };
    }

    private async translateWithGoogle(text: string, targetLang: string): Promise<TranslationResult> {
        const googleTargetLang = GOOGLE_LANG_MAP[targetLang] || 'en';

        const result = await translate(text, { to: googleTargetLang });

        return {
            text: result.text,
            detectedSourceLang: result.from?.language?.iso,
            provider: 'google',
        };
    }

    private isQuotaExceeded(error: unknown): boolean {
        // 檢查錯誤訊息
        if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            return msg.includes('quota') || msg.includes('limit exceeded') || msg.includes('456');
        }
        return false;
    }

    /**
     * 檢查 DeepL 剩餘額度
     */
    async getDeeplUsage(): Promise<{ used: number; limit: number } | null> {
        if (!this.deeplClient) return null;

        try {
            const usage = await this.deeplClient.getUsage();
            if (usage.character) {
                return {
                    used: usage.character.count,
                    limit: usage.character.limit,
                };
            }
        } catch (error) {
            console.error('Failed to get DeepL usage:', error);
        }
        return null;
    }
}

// 單例模式
let translationServiceInstance: TranslationService | null = null;

export function getTranslationService(): TranslationService {
    if (!translationServiceInstance) {
        translationServiceInstance = new TranslationService();
    }
    return translationServiceInstance;
}

export { TranslationService };
export type { TranslationResult };
