'use client';

import { useState, useEffect } from 'react';
import { Ban, CheckCircle, Loader2, X } from 'lucide-react';

interface BlacklistEntry {
  id: string;
  email: string;
  reason: string;
  created_at: string;
  created_by: string;
}

export default function AdminBlacklistPage() {
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 解封確認
  const [unblockModal, setUnblockModal] = useState<{ open: boolean; entry: BlacklistEntry | null }>({ open: false, entry: null });
  const [isUnblocking, setIsUnblocking] = useState(false);

  const fetchBlacklist = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/blacklist');
      if (response.ok) {
        const data = await response.json();
        setBlacklist(data.blacklist);
      }
    } catch (error) {
      console.error('Error fetching blacklist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlacklist();
  }, []);

  const handleUnblock = async () => {
    if (!unblockModal.entry) return;
    setIsUnblocking(true);

    try {
      // 需要先找到對應的用戶 ID
      // 由於黑名單只存 email，我們需要通過 email 查找用戶
      const response = await fetch(`/api/admin/blacklist/${unblockModal.entry.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUnblockModal({ open: false, entry: null });
        fetchBlacklist();
      } else {
        alert('解除封鎖失敗');
      }
    } catch (error) {
      console.error('Error unblocking:', error);
      alert('解除封鎖失敗');
    } finally {
      setIsUnblocking(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">黑名單管理</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Ban className="w-4 h-4" />
          共 {blacklist.length} 筆
        </div>
      </div>

      {/* 表格 */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : blacklist.length === 0 ? (
          <div className="text-center py-20">
            <Ban className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">黑名單為空</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">封鎖原因</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">封鎖時間</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {blacklist.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Ban className="w-4 h-4 text-red-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {entry.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[300px]">
                      <p className="truncate" title={entry.reason}>
                        {entry.reason}
                      </p>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(entry.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => setUnblockModal({ open: true, entry })}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        解除封鎖
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 解封確認 Modal */}
      {unblockModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-green-600">解除封鎖</h3>
              <button onClick={() => setUnblockModal({ open: false, entry: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                確定要解除「{unblockModal.entry?.email}」的封鎖嗎？
                <br /><br />
                <span className="text-gray-500">封鎖原因：{unblockModal.entry?.reason}</span>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setUnblockModal({ open: false, entry: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleUnblock}
                disabled={isUnblocking}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isUnblocking && <Loader2 className="w-4 h-4 animate-spin" />}
                確認解除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
