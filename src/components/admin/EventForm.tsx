'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  HololiveEvent,
  EventCategory,
  EVENT_CATEGORY_INFO,
  TicketPriceTier,
  CurrencyCode,
  CURRENCY_INFO,
} from '@/types';
import { getCurrencySymbol } from '@/lib/currency';
import { Calendar, MapPin, Ticket, FileText, Plus, Trash2, Settings, Bell } from 'lucide-react';

interface EventFormProps {
  initialData?: HololiveEvent;
  onSubmit: (data: Omit<HololiveEvent, 'id' | 'createdAt' | 'updatedAt'>) => void | Promise<void>;
  isEditing?: boolean;
}

// 預設票種等級列（4列）- 座位等級自訂字串，人數統一由 maxTicketsPerPerson 決定
const createDefaultPriceTiers = (): TicketPriceTier[] => [
  { seatGrade: 'SS', priceJpy: undefined },
  { seatGrade: 'S', priceJpy: undefined },
  { seatGrade: 'A', priceJpy: undefined },
  { seatGrade: 'B', priceJpy: undefined },
];

export default function EventForm({ initialData, onSubmit, isEditing }: EventFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    artist: initialData?.artist || '',
    eventDate: initialData?.eventDate
      ? new Date(initialData.eventDate).toISOString().split('T')[0]
      : '',
    eventEndDate: initialData?.eventEndDate
      ? new Date(initialData.eventEndDate).toISOString().split('T')[0]
      : '',
    venue: initialData?.venue || '',
    venueAddress: initialData?.venueAddress || '',
    description: initialData?.description || '',
    category: initialData?.category || 'concert',
    currency: initialData?.currency || 'JPY',
    isActive: initialData?.isActive ?? true,
    maxTicketsPerPerson: initialData?.maxTicketsPerPerson || 2,
    maxRequestsPerUser: initialData?.maxRequestsPerUser || 2,
    discordWebhookUrl: (initialData as { discordWebhookUrl?: string })?.discordWebhookUrl || '',
  });

  const [priceTiers, setPriceTiers] = useState<TicketPriceTier[]>(
    initialData?.ticketPriceTiers?.length ? initialData.ticketPriceTiers : createDefaultPriceTiers()
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 票種等級操作
  const handlePriceTierChange = (index: number, field: keyof TicketPriceTier, value: string | number | undefined) => {
    setPriceTiers((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addPriceTier = () => {
    setPriceTiers((prev) => [...prev, { seatGrade: '', priceJpy: undefined }]);
  };

  const removePriceTier = (index: number) => {
    if (priceTiers.length > 1) {
      setPriceTiers((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = '請輸入活動名稱';
    }
    if (!formData.artist.trim()) {
      newErrors.artist = '請輸入藝人/團體';
    }
    if (!formData.eventDate) {
      newErrors.eventDate = '請選擇活動日期';
    }
    if (!formData.venue.trim()) {
      newErrors.venue = '請輸入場地';
    }

    // 檢查至少有一個有效的票種（有座位等級名稱）
    const validPriceTiers = priceTiers.filter((tier) => tier.seatGrade.trim() !== '');
    if (validPriceTiers.length === 0) {
      newErrors.priceTiers = '請至少設定一個票種（須填寫座位等級名稱）';
    } else {
      // 檢查每個有效票種是否都有設定價格
      const missingPrice = validPriceTiers.some((tier) => tier.priceJpy === undefined || tier.priceJpy === null || tier.priceJpy <= 0);
      if (missingPrice) {
        newErrors.priceTiers = '所有票種都必須設定有效的價格（大於 0）';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    // 只保留有效的票種等級（有座位等級名稱）
    const validPriceTiers = priceTiers.filter((tier) => tier.seatGrade.trim() !== '');

    try {
      await onSubmit({
        name: formData.name.trim(),
        artist: formData.artist.trim(),
        eventDate: new Date(formData.eventDate),
        eventEndDate: formData.eventEndDate ? new Date(formData.eventEndDate) : undefined,
        venue: formData.venue.trim(),
        venueAddress: formData.venueAddress.trim() || undefined,
        description: formData.description.trim() || undefined,
        ticketPriceTiers: validPriceTiers,
        category: formData.category as EventCategory,
        currency: formData.currency as CurrencyCode,
        isActive: formData.isActive,
        maxTicketsPerPerson: formData.maxTicketsPerPerson,
        maxRequestsPerUser: formData.maxRequestsPerUser,
        discordWebhookUrl: formData.discordWebhookUrl.trim() || undefined,
      } as Omit<HololiveEvent, 'id' | 'createdAt' | 'updatedAt'> & { discordWebhookUrl?: string });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8 w-full max-w-none">
      {/* 基本資訊 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          基本資訊
        </h2>
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2">
          {/* 活動名稱 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              活動名稱 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="例：hololive 5th fes. Capture the Moment"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>

          {/* 藝人/團體 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              藝人/團體 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="artist"
              value={formData.artist}
              onChange={handleChange}
              placeholder="例：hololive, 星街すいせい, Suisei"
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.artist ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">使用逗號（,）分隔多個標籤</p>
            {formData.artist && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.artist.split(',').map((tag, index) => {
                  const trimmedTag = tag.trim();
                  if (!trimmedTag) return null;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300"
                    >
                      {trimmedTag}
                    </span>
                  );
                })}
              </div>
            )}
            {errors.artist && <p className="text-red-500 text-sm mt-1">{errors.artist}</p>}
          </div>

          {/* 分類 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">分類</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              {Object.entries(EVENT_CATEGORY_INFO).map(([key, info]) => (
                <option key={key} value={key}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* 描述 */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">描述</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="活動簡介..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </section>

      {/* 時間地點 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-500" />
          時間地點
        </h2>
        <div className="grid gap-4 lg:gap-6 md:grid-cols-2">
          {/* 活動日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              活動日期 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="eventDate"
              value={formData.eventDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.eventDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
            />
            {errors.eventDate && <p className="text-red-500 text-sm mt-1">{errors.eventDate}</p>}
          </div>

          {/* 結束日期 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              結束日期（多日活動）
            </label>
            <input
              type="date"
              name="eventEndDate"
              value={formData.eventEndDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* 場地 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              場地 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleChange}
                placeholder="例：幕張メッセ"
                className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${errors.venue ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
              />
            </div>
            {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
          </div>

          {/* 場地地址 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              場地地址 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="venueAddress"
              value={formData.venueAddress}
              onChange={handleChange}
              placeholder="例：千葉県千葉市美浜区中瀬2-1"
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>
      </section>

      {/* 票價設定（價格天花板） */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
          <Ticket className="w-5 h-5 text-indigo-500" />
          票種設定
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4">
          設定各座位等級與票種的組合，用戶發布時可選擇
        </p>

        {/* 幣值選擇 */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            票價幣值
          </label>
          <select
            name="currency"
            value={formData.currency}
            onChange={handleChange}
            className="w-full sm:w-48 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
          >
            {(Object.keys(CURRENCY_INFO) as CurrencyCode[]).map((code) => (
              <option key={code} value={code}>
                {CURRENCY_INFO[code].symbol} {CURRENCY_INFO[code].nameZh} ({code})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {/* 表頭 - 只在桌面顯示 */}
          <div className="hidden sm:grid grid-cols-12 gap-2 text-sm font-medium text-gray-600 dark:text-gray-300 pb-2 border-b dark:border-gray-700">
            <div className="col-span-6">座位等級名稱（自訂）</div>
            <div className="col-span-4">原價（{getCurrencySymbol(formData.currency as CurrencyCode)}）</div>
            <div className="col-span-2"></div>
          </div>

          {/* 票價列表 */}
          {priceTiers.map((tier, index) => (
            <div key={index} className="relative">
              {/* 手機版 - 卡片式 */}
              <div className="sm:hidden bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">票價 #{index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removePriceTier(index)}
                    disabled={priceTiers.length <= 1}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">座位等級</label>
                    <input
                      type="text"
                      value={tier.seatGrade}
                      onChange={(e) => handlePriceTierChange(index, 'seatGrade', e.target.value)}
                      placeholder="SS、S..."
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">原價({getCurrencySymbol(formData.currency as CurrencyCode)})</label>
                    <input
                      type="number"
                      value={tier.priceJpy ?? ''}
                      onChange={(e) => handlePriceTierChange(index, 'priceJpy', e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="10000"
                      className="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* 桌面版 - 表格式 */}
              <div className="hidden sm:grid grid-cols-12 gap-2 items-center">
                <div className="col-span-6">
                  <input
                    type="text"
                    value={tier.seatGrade}
                    onChange={(e) => handlePriceTierChange(index, 'seatGrade', e.target.value)}
                    placeholder="例：SS、S、A、B"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                <div className="col-span-4">
                  <input
                    type="number"
                    value={tier.priceJpy ?? ''}
                    onChange={(e) => handlePriceTierChange(index, 'priceJpy', e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="10000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm"
                  />
                </div>
                <div className="col-span-2 flex justify-center">
                  <button
                    type="button"
                    onClick={() => removePriceTier(index)}
                    disabled={priceTiers.length <= 1}
                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* 新增按鈕 */}
          <button
            type="button"
            onClick={addPriceTier}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium mt-2"
          >
            <Plus className="w-4 h-4" />
            新增票價等級
          </button>

          {errors.priceTiers && <p className="text-red-500 text-sm mt-2">{errors.priceTiers}</p>}
        </div>
      </section>

      {/* 其他 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
          <Settings className="w-5 h-5 text-indigo-500" />
          其他設定
        </h2>
        <div className="grid gap-4 lg:gap-6">

          {/* 每人最多購票張數 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              每人最多購票張數 <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="maxTicketsPerPerson"
                value={formData.maxTicketsPerPerson}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-24 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">張/人</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              決定用戶發布刊登時可選擇的最大人數（例如設為 4，則可選 1～4 人票）
            </p>
          </div>

          {/* 每帳號求票上限 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              每帳號求票上限
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                name="maxRequestsPerUser"
                value={formData.maxRequestsPerUser}
                onChange={handleChange}
                min={1}
                max={10}
                className="w-24 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">張/帳號</span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              限制每個用戶在此活動可提交的求票數量
            </p>
          </div>

          {/* 啟用顯示 */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-200">
              啟用顯示（關閉後前台不會顯示此活動）
            </label>
          </div>
        </div>
      </section>

      {/* Discord Webhook 通知 */}
      <section className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 lg:p-8 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6 flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          Discord Webhook 通知
        </h2>
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            設定 Discord Webhook URL 後，當有新刊登發布時會自動發送通知到指定的 Discord 頻道。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Discord Webhook URL
            </label>
            <input
              type="url"
              name="discordWebhookUrl"
              value={formData.discordWebhookUrl}
              onChange={handleChange}
              placeholder="https://discord.com/api/webhooks/..."
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              在 Discord 頻道設定 → 整合 → Webhook 中建立
            </p>
          </div>
        </div>
      </section>

      {/* 按鈕 */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/events')}
          className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '處理中...' : (isEditing ? '儲存變更' : '新增活動')}
        </button>
      </div>
    </form>
  );
}
