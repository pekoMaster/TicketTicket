import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getTranslationService } from '@/lib/translationService';

export async function POST(request: Request) {
    try {
        // 驗證用戶身份
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { text, targetLang } = await request.json();

        if (!text || typeof text !== 'string') {
            return NextResponse.json({ error: 'Missing text' }, { status: 400 });
        }

        if (!targetLang || typeof targetLang !== 'string') {
            return NextResponse.json({ error: 'Missing targetLang' }, { status: 400 });
        }

        // 支援的語言
        const supportedLangs = ['en', 'ja', 'zh-TW', 'zh-CN'];
        if (!supportedLangs.includes(targetLang)) {
            return NextResponse.json({ error: 'Unsupported language' }, { status: 400 });
        }

        const translationService = getTranslationService();
        const result = await translationService.translate(text, targetLang);

        return NextResponse.json({
            translatedText: result.text,
            detectedSourceLang: result.detectedSourceLang,
            provider: result.provider,
        });
    } catch (error) {
        console.error('Translation error:', error);
        return NextResponse.json(
            { error: 'Translation failed' },
            { status: 500 }
        );
    }
}

// 獲取 DeepL 使用量
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.dbId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const translationService = getTranslationService();
        const usage = await translationService.getDeeplUsage();

        return NextResponse.json({ usage });
    } catch (error) {
        console.error('Error getting usage:', error);
        return NextResponse.json({ error: 'Failed to get usage' }, { status: 500 });
    }
}
