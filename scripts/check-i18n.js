const fs = require('fs');
const path = require('path');

// 設定
const SRC_DIR = path.join(__dirname, '../src');
const MESSAGES_DIR = path.join(__dirname, '../messages');
const LANGUAGES = ['zh-TW', 'zh-CN', 'en', 'ja'];

// 掃描目錄
function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            if (f.endsWith('.tsx') || f.endsWith('.ts')) {
                callback(dirPath);
            }
        }
    });
}

// 提取翻譯鍵值
function extractKeys(content) {
    const keys = [];

    // 1. 匹配 useTranslations('NAMESPACE')
    const useTranslationsRegex = /const\s+(\w+)\s*=\s*useTranslations\(\s*['"]([^'"]+)['"]\s*\)/g;
    let match;
    while ((match = useTranslationsRegex.exec(content)) !== null) {
        const varName = match[1]; // e.g., t
        const namespace = match[2]; // e.g., profile

        // 在同個檔案中尋找 t('KEY')
        // 簡單的正則，不處理 scope，假設變數名唯一
        const usageRegex = new RegExp(`\\b${varName}\\(\\s*['"]([^'"]+)['"]`, 'g');
        let usageMatch;
        while ((usageMatch = usageRegex.exec(content)) !== null) {
            keys.push({ namespace, key: usageMatch[1] });
        }

        // 處理 t.rich('KEY', ...)
        const richUsageRegex = new RegExp(`\\b${varName}\\.rich\\(\\s*['"]([^'"]+)['"]`, 'g');
        let richMatch;
        while ((richMatch = richUsageRegex.exec(content)) !== null) {
            keys.push({ namespace, key: richMatch[1] });
        }
    }

    // 2. 匹配無參數 useTranslations() -> keys are 'NAMESPACE.KEY'
    const useTranslationsNoArgRegex = /const\s+(\w+)\s*=\s*useTranslations\(\s*\)/g;
    while ((match = useTranslationsNoArgRegex.exec(content)) !== null) {
        const varName = match[1];
        const usageRegex = new RegExp(`\\b${varName}\\(\\s*['"]([^'"]+)['"]`, 'g');
        let usageMatch;
        while ((usageMatch = usageRegex.exec(content)) !== null) {
            const fullKey = usageMatch[1];
            const parts = fullKey.split('.');
            if (parts.length > 1) {
                keys.push({ namespace: parts[0], key: parts.slice(1).join('.') });
            } else {
                // 可能是 root key，暫不處理
            }
        }
    }

    return keys;
}

// 檢查鍵值是否存在
function keyExists(obj, keyPath) {
    const parts = keyPath.split('.');
    let current = obj;
    for (const part of parts) {
        if (current === undefined || current === null) return false;
        current = current[part];
    }
    return current !== undefined;
}

// 主程式
function main() {
    console.log('🔍 Starting translation check...');

    // 1. 收集需檢查的鍵值
    const requiredKeys = [];
    walkDir(SRC_DIR, (filePath) => {
        const content = fs.readFileSync(filePath, 'utf-8');
        const keys = extractKeys(content);
        keys.forEach(k => {
            requiredKeys.push({ ...k, file: path.relative(path.join(__dirname, '..'), filePath) });
        });
    });

    console.log(`📝 Found ${requiredKeys.length} translation usages.`);

    // 2. 載入語言檔
    const languagesData = {};
    LANGUAGES.forEach(lang => {
        const jsonPath = path.join(MESSAGES_DIR, `${lang}.json`);
        try {
            if (fs.existsSync(jsonPath)) {
                languagesData[lang] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
            } else {
                console.error(`❌ Language file missing: ${jsonPath}`);
            }
        } catch (e) {
            console.error(`❌ Error parsing ${jsonPath}:`, e.message);
        }
    });

    // 3. 檢查缺失
    let errorCount = 0;

    requiredKeys.forEach(({ namespace, key, file }) => {
        LANGUAGES.forEach(lang => {
            const langData = languagesData[lang];
            if (!langData) return;

            // 檢查 Namespace
            if (!langData[namespace]) {
                console.error(`❌ [${lang}] Missing Namespace: "${namespace}" (Used in ${file})`);
                errorCount++;
                return;
            }

            // 檢查 Key
            if (!keyExists(langData[namespace], key)) {
                console.error(`❌ [${lang}] Missing Key: "${namespace}.${key}" (Used in ${file})`);
                errorCount++;
            }
        });
    });

    if (errorCount > 0) {
        console.error(`\n💥 Found ${errorCount} missing translations!`);
        process.exit(1);
    } else {
        console.log('\n✅ All translations look good!');
        process.exit(0);
    }
}

main();
