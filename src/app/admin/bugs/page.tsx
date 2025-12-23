'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Eye, ChevronLeft, ChevronRight, Loader2, X, RefreshCw, Bug, MessageSquare } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';

interface BugReport {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'resolved' | 'unresolvable' | 'ignored' | 'not_a_bug';
    admin_note: string | null;
    created_at: string;
    updated_at: string;
    reporter: {
        id: string;
        username: string;
        email: string;
        avatar_url?: string;
        custom_avatar_url?: string;
    };
}

interface Pagination {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

const STATUS_OPTIONS = [
    { value: 'pending', label: '待處理', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' },
    { value: 'resolved', label: '已解決', color: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' },
    { value: 'unresolvable', label: '無法解決', color: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300' },
    { value: 'ignored', label: '已忽略', color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' },
    { value: 'not_a_bug', label: '非 BUG', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300' },
];

export default function AdminBugsPage() {
    const [bugReports, setBugReports] = useState<BugReport[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    // 詳情 Modal
    const [detailModal, setDetailModal] = useState<{ open: boolean; bug: BugReport | null }>({ open: false, bug: null });
    const [isUpdating, setIsUpdating] = useState(false);
    const [editStatus, setEditStatus] = useState('');
    const [editNote, setEditNote] = useState('');

    const fetchBugReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                page: pagination.page.toString(),
                limit: pagination.limit.toString(),
            });
            if (statusFilter) {
                params.set('status', statusFilter);
            }

            const response = await fetch(`/api/admin/bugs?${params}`);
            if (response.ok) {
                const data = await response.json();
                setBugReports(data.bugReports);
                setPagination(data.pagination);
            }
        } catch (error) {
            console.error('Error fetching bug reports:', error);
        } finally {
            setIsLoading(false);
        }
    }, [pagination.page, pagination.limit, statusFilter]);

    useEffect(() => {
        fetchBugReports();
    }, [fetchBugReports]);

    const openDetailModal = (bug: BugReport) => {
        setEditStatus(bug.status);
        setEditNote(bug.admin_note || '');
        setDetailModal({ open: true, bug });
    };

    const handleUpdate = async () => {
        if (!detailModal.bug) return;
        setIsUpdating(true);

        try {
            const response = await fetch(`/api/admin/bugs/${detailModal.bug.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: editStatus,
                    adminNote: editNote,
                }),
            });

            if (response.ok) {
                setDetailModal({ open: false, bug: null });
                fetchBugReports();
            } else {
                alert('更新失敗');
            }
        } catch (error) {
            console.error('Error updating bug report:', error);
            alert('更新失敗');
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('zh-TW', { hour12: false });
    };

    const getStatusBadge = (status: string) => {
        const option = STATUS_OPTIONS.find(o => o.value === status);
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${option?.color || 'bg-gray-100 text-gray-800'}`}>
                {option?.label || status}
            </span>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Bug className="w-6 h-6 text-red-500" />
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">BUG 回報管理</h1>
                </div>

                {/* 篩選 */}
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value);
                            setPagination(p => ({ ...p, page: 1 }));
                        }}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="">全部狀態</option>
                        {STATUS_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchBugReports}
                        disabled={isLoading}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 inline mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        刷新
                    </button>
                </div>
            </div>

            {/* 表格 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    </div>
                ) : bugReports.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                        沒有找到 BUG 回報
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">回報者</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">標題</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">建立時間</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {bugReports.map((bug) => (
                                    <tr key={bug.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-3">
                                                <Avatar
                                                    src={bug.reporter?.custom_avatar_url || bug.reporter?.avatar_url || undefined}
                                                    size="sm"
                                                />
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                                        {bug.reporter?.username || '未知用戶'}
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                                        {bug.reporter?.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="text-gray-900 dark:text-gray-100 max-w-xs truncate">
                                                {bug.title}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            {getStatusBadge(bug.status)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {formatDate(bug.created_at)}
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <button
                                                onClick={() => openDetailModal(bug)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                                                title="查看詳情"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </button>
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

            {/* 詳情 Modal */}
            {detailModal.open && detailModal.bug && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">BUG 回報詳情</h3>
                            <button onClick={() => setDetailModal({ open: false, bug: null })} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            {/* 回報者資訊 */}
                            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <Avatar
                                    src={detailModal.bug.reporter?.custom_avatar_url || detailModal.bug.reporter?.avatar_url || undefined}
                                    size="md"
                                />
                                <div>
                                    <div className="font-medium text-gray-900 dark:text-gray-100">
                                        {detailModal.bug.reporter?.username}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {detailModal.bug.reporter?.email}
                                    </div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">
                                        回報時間：{formatDate(detailModal.bug.created_at)}
                                    </div>
                                </div>
                            </div>

                            {/* 標題 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">標題</label>
                                <p className="text-gray-900 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    {detailModal.bug.title}
                                </p>
                            </div>

                            {/* 描述 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題描述</label>
                                <p className="text-gray-900 dark:text-gray-100 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg whitespace-pre-wrap">
                                    {detailModal.bug.description}
                                </p>
                            </div>

                            {/* 狀態 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">狀態</label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                >
                                    {STATUS_OPTIONS.map(option => (
                                        <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                </select>
                            </div>

                            {/* 管理員備註 */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">管理員備註</label>
                                <textarea
                                    value={editNote}
                                    onChange={(e) => setEditNote(e.target.value)}
                                    placeholder="備註（可選）"
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setDetailModal({ open: false, bug: null })}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                取消
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                                儲存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
