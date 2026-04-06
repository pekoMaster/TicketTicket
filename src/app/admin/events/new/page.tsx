'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/contexts/AdminContext';
import EventForm from '@/components/admin/EventForm';
import { ArrowLeft, Globe, Loader2, AlertTriangle, CheckCircle, X } from 'lucide-react';
import Link from 'next/link';
import type { ScrapedEventData } from '@/lib/event-scraper';
import type { HololiveEvent } from '@/types';

export default function NewEventPage() {
  const router = useRouter();
  const { addEvent } = useAdmin();

  // URL 匯入相關狀態
  const [showImportModal, setShowImportModal] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [importedData, setImportedData] = useState<ScrapedEventData | null>(null);

  // 將匯入的資料轉換為 EventForm 需要的 initialData 格式
  const [prefillData, setPrefillData] = useState<Partial<HololiveEvent> | null>(null);

  const handleSubmit = async (data: Parameters<typeof addEvent>[0]) => {
    const result = await addEvent(data);
    if (result) {
      router.push('/admin/events');
    } else {
      alert('新增活動失敗，請檢查控制台錯誤訊息');
    }
  };

  const handleImport = async () => {
    if (!importUrl.trim()) {
      setImportError('請輸入 URL');
      return;
    }

    setIsImporting(true);
    setImportError('');
    setImportWarnings([]);

    try {
      const response = await fetch('/api/events/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: importUrl.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        setImportError(result.error || '匯入失敗');
        return;
      }

      const scraped: ScrapedEventData = result.data;
      setImportedData(scraped);
      setImportWarnings(result.warnings || []);

      // 轉換為 prefill 格式
      setPrefillData({
        name: scraped.name,
        artist: scraped.artist,
        eventDate: scraped.eventDate ? new Date(scraped.eventDate) : undefined,
        eventEndDate: scraped.eventEndDate ? new Date(scraped.eventEndDate) : undefined,
        venue: scraped.venue,
        venueAddress: scraped.venueAddress,
        description: buildDescription(scraped),
        category: scraped.category,
        ticketPriceTiers: scraped.ticketPriceTiers,
        isActive: true,
      } as Partial<HololiveEvent>);

      setShowImportModal(false);
    } catch (err) {
      setImportError('網路錯誤，請稍後再試');
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // 組合描述文字
  const buildDescription = (data: ScrapedEventData): string => {
    const parts: string[] = [];
    if (data.description) parts.push(data.description);
    if (data.originalCurrency && data.originalCurrency !== 'JPY') {
      parts.push(`\n⚠️ 票價為 ${data.originalCurrency} 計價`);
    }
    parts.push(`\n📎 來源: ${data.sourceUrl}`);
    return parts.join('\n');
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/events"
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">新增活動</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">建立新的 HOLOLIVE 活動</p>
          </div>
        </div>

        {/* 從 URL 匯入按鈕 */}
        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-medium rounded-lg shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <Globe className="w-4 h-4" />
          從 URL 匯入
        </button>
      </div>

      {/* 匯入成功提示 */}
      {prefillData && importedData && (
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-emerald-800 dark:text-emerald-200">
                已從 URL 匯入活動資料
              </p>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                {importedData.sourceUrl}
              </p>
              {importWarnings.length > 0 && (
                <div className="mt-3 space-y-1">
                  {importWarnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-emerald-500 dark:text-emerald-500 mt-2">
                請檢查並調整下方表單後再儲存
              </p>
            </div>
            <button
              onClick={() => { setPrefillData(null); setImportedData(null); setImportWarnings([]); }}
              className="p-1 rounded hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
            >
              <X className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </button>
          </div>
        </div>
      )}

      {/* Form - 帶有 prefill 資料 */}
      <EventForm
        key={prefillData ? 'prefilled' : 'empty'}
        onSubmit={handleSubmit}
        initialData={prefillData as HololiveEvent | undefined}
      />

      {/* URL 匯入 Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b dark:border-gray-700 bg-gradient-to-r from-emerald-500 to-teal-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-white" />
                  <h3 className="text-lg font-semibold text-white">從 URL 匯入活動</h3>
                </div>
                <button
                  onClick={() => { setShowImportModal(false); setImportError(''); }}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                貼入 hololive 或其他活動的票務頁面 URL，系統將自動解析活動名稱、日期、場地、票價等資訊並填入表單。
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  活動頁面 URL
                </label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => { setImportUrl(e.target.value); setImportError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleImport(); }}
                  placeholder="https://serendipity.hololivepro.com/ticket/"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  autoFocus
                  disabled={isImporting}
                />
              </div>

              {/* 錯誤訊息 */}
              {importError && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <span className="text-sm text-red-700 dark:text-red-300">{importError}</span>
                </div>
              )}

              {/* 支援提示 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <p>✔ 支援 hololive production 活動頁面</p>
                <p>✔ 自動解析活動名稱、日期（含多日）、場地與地址</p>
                <p>✔ 自動解析票價等級（USD/JPY）</p>
                <p>⚠ 解析結果僅供參考，請務必檢查並修正</p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => { setShowImportModal(false); setImportError(''); }}
                disabled={isImporting}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={isImporting || !importUrl.trim()}
                className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    解析中...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    開始解析
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
