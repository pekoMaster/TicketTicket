'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2, X, Bell, FileText, RefreshCw } from 'lucide-react';

interface Host {
  id: string;
  username: string;
  email: string;
}

interface Listing {
  id: string;
  event_name: string;
  event_date: string;
  status: string;
  total_slots: number;
  available_slots: number;
  asking_price_jpy: number;
  original_price_jpy: number;
  ticket_type: string;
  seat_grade: string;
  ticket_count_type: string;
  description: string;
  meeting_time: string;
  meeting_location: string;
  identification_features: string;
  host_nationality: string;
  host_languages: string[];
  exchange_event_name?: string;
  exchange_seat_grade?: string;
  subsidy_amount?: number;
  subsidy_direction?: string;
  created_at: string;
  host: Host;
  applications_count: number;
  is_completed?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // 編輯 Modal
  const [editModal, setEditModal] = useState<{ open: boolean; listing: Listing | null }>({ open: false, listing: null });
  const [editForm, setEditForm] = useState({ event_name: '', status: '', notify: false, notifyMessage: '' });
  const [isEditing, setIsEditing] = useState(false);

  // 刪除 Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; listing: Listing | null }>({ open: false, listing: null });
  const [deleteForm, setDeleteForm] = useState({ reason: '', notify: true, notifyMessage: '' });
  const [isDeleting, setIsDeleting] = useState(false);

  // 詳情 Modal
  const [detailModal, setDetailModal] = useState<{ open: boolean; listing: Listing | null }>({ open: false, listing: null });

  // 刷新中
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchListings = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        status: statusFilter,
        sortBy,
        sortOrder,
      });

      const response = await fetch(`/api/admin/listings?${params}`);
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchListings();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchListings();
    setIsRefreshing(false);
  };

  const openEditModal = (listing: Listing) => {
    setEditForm({
      event_name: listing.event_name,
      status: listing.status,
      notify: false,
      notifyMessage: '',
    });
    setEditModal({ open: true, listing });
  };

  const handleEdit = async () => {
    if (!editModal.listing) return;
    setIsEditing(true);

    try {
      const response = await fetch(`/api/admin/listings/${editModal.listing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: {
            event_name: editForm.event_name,
            status: editForm.status,
          },
          notify: editForm.notify,
          notifyMessage: editForm.notifyMessage,
        }),
      });

      if (response.ok) {
        setEditModal({ open: false, listing: null });
        fetchListings();
      } else {
        alert('編輯失敗');
      }
    } catch (error) {
      console.error('Error editing listing:', error);
      alert('編輯失敗');
    } finally {
      setIsEditing(false);
    }
  };

  const openDeleteModal = (listing: Listing) => {
    setDeleteForm({ reason: '', notify: true, notifyMessage: '' });
    setDeleteModal({ open: true, listing });
  };

  const handleDelete = async () => {
    if (!deleteModal.listing) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/listings/${deleteModal.listing.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: deleteForm.reason,
          notify: deleteForm.notify,
          notifyMessage: deleteForm.notifyMessage || deleteForm.reason,
        }),
      });

      if (response.ok) {
        setDeleteModal({ open: false, listing: null });
        fetchListings();
      } else {
        alert('刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting listing:', error);
      alert('刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string, isCompleted?: boolean) => {
    // 如果是已完成，優先顯示已完成狀態
    if (isCompleted) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
          ✓ 已完成
        </span>
      );
    }
    const styles: Record<string, string> = {
      open: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
      matched: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
      closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    };
    const labels: Record<string, string> = {
      open: '開放中',
      matched: '已配對',
      closed: '已關閉',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.closed}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getTicketTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      find_companion: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
      main_ticket_transfer: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300',
      sub_ticket_transfer: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300',
      ticket_exchange: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
    };
    const labels: Record<string, string> = {
      find_companion: '尋找同行',
      main_ticket_transfer: '母票轉讓',
      sub_ticket_transfer: '子票轉讓',
      ticket_exchange: '換票',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-gray-100 text-gray-800'}`}>
        {labels[type] || type}
      </span>
    );
  };

  const getTicketCountLabel = (type: string) => {
    const labels: Record<string, string> = {
      solo: '一人',
      duo: '二人',
      family: '家庭',
    };
    return labels[type] || type;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">刊登管理</h1>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors disabled:opacity-50"
            title="刷新資料"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            共 {pagination.total} 筆
          </span>
        </div>

        {/* 搜尋和篩選 */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋活動名稱..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">全部狀態</option>
            <option value="open">開放中</option>
            <option value="matched">已配對</option>
            <option value="closed">已關閉</option>
          </select>

          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="created_at-desc">最新發布</option>
            <option value="created_at-asc">最早發布</option>
            <option value="event_date-asc">活動日期（近到遠）</option>
            <option value="event_date-desc">活動日期（遠到近）</option>
          </select>
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            沒有找到刊登
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">活動</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">主辦方</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">類型</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">票種/人數</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">申請</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">價格</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {listings.map((listing) => (
                  <tr key={listing.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-3 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-[180px] truncate" title={listing.event_name}>
                        {listing.event_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(listing.event_date)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100">{listing.host?.username || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 max-w-[120px] truncate">{listing.host?.email || '-'}</div>
                    </td>
                    <td className="px-3 py-3">
                      {getTicketTypeBadge(listing.ticket_type)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{listing.seat_grade || '-'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{getTicketCountLabel(listing.ticket_count_type)}</div>
                    </td>
                    <td className="px-3 py-3">
                      {getStatusBadge(listing.status, listing.is_completed)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {listing.applications_count}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-900 dark:text-gray-100">
                      <div>¥ {listing.asking_price_jpy?.toLocaleString() || 0}</div>
                      <div className="text-xs text-gray-500">≈ NT$ {Math.round((listing.asking_price_jpy || 0) * 0.22).toLocaleString()}</div>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setDetailModal({ open: true, listing })}
                          className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30 rounded-lg transition-colors"
                          title="查看詳情"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(listing)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(listing)}
                          className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="刪除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 分頁 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              共 {pagination.total} 筆，第 {pagination.page} / {pagination.totalPages} 頁
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                disabled={pagination.page === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPagination(p => ({ ...p, page: Math.min(p.totalPages, p.page + 1) }))}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 編輯 Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">編輯刊登</h3>
              <button onClick={() => setEditModal({ open: false, listing: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">活動名稱</label>
                <input
                  type="text"
                  value={editForm.event_name}
                  onChange={(e) => setEditForm(f => ({ ...f, event_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="open">開放中</option>
                  <option value="matched">已配對</option>
                  <option value="closed">已關閉</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notify"
                  checked={editForm.notify}
                  onChange={(e) => setEditForm(f => ({ ...f, notify: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="notify" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  通知相關用戶
                </label>
              </div>
              {editForm.notify && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知內容</label>
                  <textarea
                    value={editForm.notifyMessage}
                    onChange={(e) => setEditForm(f => ({ ...f, notifyMessage: e.target.value }))}
                    placeholder="請輸入通知內容..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditModal({ open: false, listing: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleEdit}
                disabled={isEditing}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isEditing && <Loader2 className="w-4 h-4 animate-spin" />}
                儲存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除 Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-red-600">確認刪除</h3>
              <button onClick={() => setDeleteModal({ open: false, listing: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                確定要刪除「{deleteModal.listing?.event_name}」嗎？此操作無法復原。
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">刪除原因 *</label>
                <textarea
                  value={deleteForm.reason}
                  onChange={(e) => setDeleteForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="請輸入刪除原因..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="deleteNotify"
                  checked={deleteForm.notify}
                  onChange={(e) => setDeleteForm(f => ({ ...f, notify: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="deleteNotify" className="text-sm text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Bell className="w-4 h-4" />
                  通知主辦方和所有申請者
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setDeleteModal({ open: false, listing: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || !deleteForm.reason}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 詳情 Modal */}
      {detailModal.open && detailModal.listing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl my-8">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                刊登詳情
              </h3>
              <button onClick={() => setDetailModal({ open: false, listing: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* 基本資訊 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">活動名稱</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{detailModal.listing.event_name}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">活動日期</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(detailModal.listing.event_date)}</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">刊登類型</label>
                  <div className="mt-1">{getTicketTypeBadge(detailModal.listing.ticket_type)}</div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 dark:text-gray-400">狀態</label>
                  <div className="mt-1">{getStatusBadge(detailModal.listing.status)}</div>
                </div>
              </div>

              {/* 票券資訊 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">票券資訊</h4>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">座位等級</label>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{detailModal.listing.seat_grade || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">票種</label>
                    <p className="text-gray-900 dark:text-gray-100">{getTicketCountLabel(detailModal.listing.ticket_count_type)}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">申請數</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.applications_count}</p>
                  </div>
                </div>
              </div>

              {/* 價格資訊 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">價格資訊</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">原價</label>
                    <p className="text-gray-900 dark:text-gray-100">¥ {detailModal.listing.original_price_jpy?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">希望價格</label>
                    <p className="font-medium text-indigo-600 dark:text-indigo-400">
                      ¥ {detailModal.listing.asking_price_jpy?.toLocaleString() || 0}
                      <span className="text-xs text-gray-500 ml-1">
                        (≈ NT$ {Math.round((detailModal.listing.asking_price_jpy || 0) * 0.22).toLocaleString()})
                      </span>
                    </p>
                  </div>
                </div>
                {/* 檢查是否收取手續費 */}
                {detailModal.listing.asking_price_jpy > detailModal.listing.original_price_jpy && (
                  <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 text-sm">
                    ⚠️ 希望價格高於原價，可能有收取額外費用
                  </div>
                )}
              </div>

              {/* 換票資訊（如果是換票類型）*/}
              {detailModal.listing.ticket_type === 'ticket_exchange' && (
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">換票資訊</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">想換的活動</label>
                      <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.exchange_event_name || '-'}</p>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 dark:text-gray-400">想換的座位</label>
                      <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.exchange_seat_grade || '任意'}</p>
                    </div>
                    {detailModal.listing.subsidy_amount && detailModal.listing.subsidy_amount > 0 && (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">補貼金額</label>
                          <p className="text-gray-900 dark:text-gray-100">¥ {detailModal.listing.subsidy_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400">補貼方向</label>
                          <p className="text-gray-900 dark:text-gray-100">
                            {detailModal.listing.subsidy_direction === 'i_pay_you' ? '我補貼對方' : '對方補貼我'}
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* 集合資訊 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">集合資訊</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">集合時間</label>
                    <p className="text-gray-900 dark:text-gray-100">
                      {detailModal.listing.meeting_time ? new Date(detailModal.listing.meeting_time).toLocaleString('zh-TW', { hour12: false, timeZone: 'Asia/Tokyo' }) : '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">集合地點</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.meeting_location || '-'}</p>
                  </div>
                </div>
              </div>

              {/* 主辦方資訊 */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">主辦方資訊</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">用戶名稱</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.host?.username || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.host?.email || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">國籍</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.host_nationality || '-'}</p>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">語言</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.host_languages?.join(', ') || '-'}</p>
                  </div>
                </div>
                {detailModal.listing.identification_features && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500 dark:text-gray-400">辨識特徵</label>
                    <p className="text-gray-900 dark:text-gray-100">{detailModal.listing.identification_features}</p>
                  </div>
                )}
              </div>

              {/* 說明內容 */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3">
                <h4 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-2">📝 說明內容（檢查是否有額外收費）</h4>
                <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {detailModal.listing.description || '（無說明）'}
                </div>
                {/* 關鍵字檢查 */}
                {detailModal.listing.description && (
                  (() => {
                    const description = detailModal.listing?.description || '';
                    const keywords = ['手續費', '服務費', '額外', '加收', '轉帳', '匯款', 'fee', 'charge', '代購費'];
                    const found = keywords.filter(k => description.toLowerCase().includes(k.toLowerCase()));
                    if (found.length > 0) {
                      return (
                        <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/30 rounded text-red-700 dark:text-red-300 text-sm">
                          ⚠️ 檢測到可疑關鍵字：{found.join('、')}
                        </div>
                      );
                    }
                    return null;
                  })()
                )}
              </div>

              {/* 建立時間 */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-right">
                建立時間：{new Date(detailModal.listing.created_at).toLocaleString('zh-TW', { hour12: false })}
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setDetailModal({ open: false, listing: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                關閉
              </button>
              <button
                onClick={() => {
                  const listing = detailModal.listing;
                  setDetailModal({ open: false, listing: null });
                  if (listing) openEditModal(listing);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                編輯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
