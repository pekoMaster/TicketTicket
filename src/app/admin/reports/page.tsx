'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Avatar from '@/components/ui/Avatar';
import {
  Flag,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Eye,
  UserX,
  CheckCircle,
  XCircle,
  MessageCircle,
  Mail,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { ReportType, ReportStatus, REPORT_TYPE_INFO, REPORT_STATUS_INFO } from '@/types';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  custom_avatar_url?: string;
  rating?: number;
  review_count?: number;
}

interface Listing {
  id: string;
  event_name: string;
  event_date: string;
  venue: string;
  ticket_type: string;
  asking_price_jpy?: number;
  host_id?: string;
}

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  conversation_id?: string;
  listing_id?: string;
  report_type: ReportType;
  reason: string;
  status: ReportStatus;
  admin_notes?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
  reporter: User;
  reported_user: User;
  listing?: Listing;
  resolved_by_user?: { id: string; username: string };
}

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { id: string; username: string };
}

export default function AdminReportsPage() {
  const { isAuthenticated } = useAdmin();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Detail modal
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [reportMessages, setReportMessages] = useState<Message[]>([]);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Blacklist modal
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  const fetchReports = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(`/api/admin/reports?${params}`);
      const data = await response.json();

      if (response.ok) {
        setReports(data.reports);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, page, statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleViewDetail = async (report: Report) => {
    setSelectedReport(report);
    setAdminNotes(report.admin_notes || '');
    setIsLoadingDetail(true);

    try {
      const response = await fetch(`/api/admin/reports/${report.id}`);
      const data = await response.json();

      if (response.ok) {
        setReportMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Failed to fetch report detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleUpdateStatus = async (status: ReportStatus) => {
    if (!selectedReport) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/reports/${selectedReport.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, adminNotes }),
      });

      if (response.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (error) {
      console.error('Failed to update report:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBlacklist = async () => {
    if (!selectedReport) return;

    setIsBlacklisting(true);
    try {
      const response = await fetch('/api/admin/blacklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: selectedReport.reported_user.email,
          reason: blacklistReason || `檢舉處理: ${REPORT_TYPE_INFO[selectedReport.report_type].label}`,
        }),
      });

      if (response.ok) {
        // Also mark report as resolved
        await handleUpdateStatus('resolved');
        setShowBlacklistModal(false);
        setBlacklistReason('');
      }
    } catch (error) {
      console.error('Failed to blacklist user:', error);
    } finally {
      setIsBlacklisting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Flag className="w-6 h-6 text-red-500" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">檢舉管理</h1>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
        >
          <option value="all">全部狀態</option>
          <option value="pending">待處理</option>
          <option value="investigating">處理中</option>
          <option value="resolved">已解決</option>
          <option value="dismissed">已駁回</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            沒有檢舉記錄
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  檢舉人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  被檢舉人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  類型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  狀態
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  時間
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={report.reporter.custom_avatar_url || report.reporter.avatar_url}
                        size="sm"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {report.reporter.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar
                        src={report.reported_user.custom_avatar_url || report.reported_user.avatar_url}
                        size="sm"
                      />
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {report.reported_user.username}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${REPORT_TYPE_INFO[report.report_type].color}`}>
                      {REPORT_TYPE_INFO[report.report_type].label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${REPORT_STATUS_INFO[report.status].color}`}>
                      {REPORT_STATUS_INFO[report.status].label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(report.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleViewDetail(report)}
                      className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                      title="查看詳情"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
              上一頁
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              第 {page} / {totalPages} 頁
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
            >
              下一頁
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Report Detail Modal */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        title="檢舉詳情"
        size="lg"
      >
        {selectedReport && (
          <div className="p-4 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Reporter & Reported */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">檢舉人</p>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={selectedReport.reporter.custom_avatar_url || selectedReport.reporter.avatar_url}
                    size="md"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedReport.reporter.username}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedReport.reporter.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 rounded-lg p-3">
                <p className="text-xs text-red-600 dark:text-red-400 mb-2">被檢舉人</p>
                <div className="flex items-center gap-2">
                  <Avatar
                    src={selectedReport.reported_user.custom_avatar_url || selectedReport.reported_user.avatar_url}
                    size="md"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {selectedReport.reported_user.username}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {selectedReport.reported_user.email}
                      </p>
                      <button
                        onClick={() => copyToClipboard(selectedReport.reported_user.email)}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="複製 Email"
                      >
                        <Copy className="w-3 h-3 text-gray-400" />
                      </button>
                      <a
                        href={`mailto:${selectedReport.reported_user.email}`}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        title="發送郵件"
                      >
                        <Mail className="w-3 h-3 text-gray-400" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Report Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs rounded-full ${REPORT_TYPE_INFO[selectedReport.report_type].color}`}>
                  {REPORT_TYPE_INFO[selectedReport.report_type].label}
                </span>
                <span className={`px-2 py-1 text-xs rounded-full ${REPORT_STATUS_INFO[selectedReport.status].color}`}>
                  {REPORT_STATUS_INFO[selectedReport.status].label}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(selectedReport.created_at)}
                </span>
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">檢舉原因</p>
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                  {selectedReport.reason}
                </p>
              </div>
            </div>

            {/* Listing Info */}
            {selectedReport.listing && (
              <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-lg p-3">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-2">相關刊登</p>
                <p className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedReport.listing.event_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedReport.listing.venue} | {new Date(selectedReport.listing.event_date).toLocaleDateString('zh-TW')}
                </p>
                <a
                  href={`/listing/${selectedReport.listing.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline mt-1"
                >
                  查看刊登 <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {/* Conversation Messages */}
            {selectedReport.conversation_id && (
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  對話記錄
                </p>
                {isLoadingDetail ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                ) : reportMessages.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    沒有對話記錄
                  </p>
                ) : (
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                    {reportMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2 rounded-lg text-sm ${
                          msg.sender_id === selectedReport.reported_user_id
                            ? 'bg-red-100 dark:bg-red-900/30'
                            : 'bg-white dark:bg-gray-600'
                        }`}
                      >
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {msg.sender?.username} - {formatDate(msg.created_at)}
                        </p>
                        <p className="text-gray-900 dark:text-gray-100">{msg.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                管理員備註
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="輸入處理備註..."
              />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
              {selectedReport.status !== 'resolved' && selectedReport.status !== 'dismissed' && (
                <>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus('investigating')}
                    disabled={isUpdating || selectedReport.status === 'investigating'}
                    loading={isUpdating}
                  >
                    標記處理中
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={isUpdating}
                    loading={isUpdating}
                    className="!bg-green-600 hover:!bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    已解決
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleUpdateStatus('dismissed')}
                    disabled={isUpdating}
                    loading={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    駁回
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setShowBlacklistModal(true)}
                    disabled={isUpdating}
                    className="!bg-red-600 hover:!bg-red-700"
                  >
                    <UserX className="w-4 h-4 mr-1" />
                    封鎖用戶
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Blacklist Confirmation Modal */}
      <Modal
        isOpen={showBlacklistModal}
        onClose={() => setShowBlacklistModal(false)}
        title="確認封鎖用戶"
        size="sm"
      >
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            確定要封鎖 <strong>{selectedReport?.reported_user.username}</strong> 嗎？
            <br />
            封鎖後該用戶將無法登入。
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              封鎖原因
            </label>
            <input
              type="text"
              value={blacklistReason}
              onChange={(e) => setBlacklistReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="輸入封鎖原因..."
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowBlacklistModal(false)}
              disabled={isBlacklisting}
            >
              取消
            </Button>
            <Button
              fullWidth
              onClick={handleBlacklist}
              disabled={isBlacklisting}
              loading={isBlacklisting}
              className="!bg-red-600 hover:!bg-red-700"
            >
              確認封鎖
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
