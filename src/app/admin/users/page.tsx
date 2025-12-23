'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, Pencil, Ban, CheckCircle, ChevronLeft, ChevronRight, Loader2, X, Star, ImageOff, Shield, ShieldOff, Crown, RefreshCw, Trash2 } from 'lucide-react';
import Avatar from '@/components/ui/Avatar';
import { useAdmin } from '@/contexts/AdminContext';
import { UserRole } from '@/types';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  custom_avatar_url: string | null;
  rating: number;
  review_count: number;
  role: UserRole;
  created_at: string;
  listings_count: number;
  is_blacklisted: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const { isSuperAdmin } = useAdmin();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showBlacklisted, setShowBlacklisted] = useState(false);

  // 編輯 Modal
  const [editModal, setEditModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [editForm, setEditForm] = useState({ username: '', removeAvatar: false, notify: false, notifyMessage: '' });
  const [isEditing, setIsEditing] = useState(false);

  // 封鎖 Modal
  const [blockModal, setBlockModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  // 解封確認
  const [unblockModal, setUnblockModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [isUnblocking, setIsUnblocking] = useState(false);

  // 角色管理 Modal（僅主管理員可見）
  const [roleModal, setRoleModal] = useState<{ open: boolean; user: User | null; action: 'grant' | 'revoke' | 'transfer' }>({
    open: false,
    user: null,
    action: 'grant'
  });
  const [transferPassword, setTransferPassword] = useState('');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  // 刪除 Modal
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search,
        isBlacklisted: showBlacklisted.toString(),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search, showBlacklisted]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination(p => ({ ...p, page: 1 }));
    fetchUsers();
  };

  const openEditModal = (user: User) => {
    setEditForm({
      username: user.username,
      removeAvatar: false,
      notify: false,
      notifyMessage: '',
    });
    setEditModal({ open: true, user });
  };

  const handleEdit = async () => {
    if (!editModal.user) return;
    setIsEditing(true);

    try {
      const response = await fetch(`/api/admin/users/${editModal.user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editForm.username,
          custom_avatar_url: editForm.removeAvatar ? null : undefined,
          notify: editForm.notify,
          notifyMessage: editForm.notifyMessage,
        }),
      });

      if (response.ok) {
        setEditModal({ open: false, user: null });
        fetchUsers();
      } else {
        alert('編輯失敗');
      }
    } catch (error) {
      console.error('Error editing user:', error);
      alert('編輯失敗');
    } finally {
      setIsEditing(false);
    }
  };

  const openBlockModal = (user: User) => {
    setBlockReason('');
    setBlockModal({ open: true, user });
  };

  const handleBlock = async () => {
    if (!blockModal.user || !blockReason) return;
    setIsBlocking(true);

    try {
      const response = await fetch(`/api/admin/users/${blockModal.user.id}/blacklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: blockReason }),
      });

      if (response.ok) {
        setBlockModal({ open: false, user: null });
        fetchUsers();
      } else {
        alert('封鎖失敗');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('封鎖失敗');
    } finally {
      setIsBlocking(false);
    }
  };

  const handleUnblock = async () => {
    if (!unblockModal.user) return;
    setIsUnblocking(true);

    try {
      const response = await fetch(`/api/admin/users/${unblockModal.user.id}/blacklist`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setUnblockModal({ open: false, user: null });
        fetchUsers();
      } else {
        alert('解除封鎖失敗');
      }
    } catch (error) {
      console.error('Error unblocking user:', error);
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
    });
  };

  // 角色管理
  const handleRoleChange = async () => {
    if (!roleModal.user) return;
    setIsUpdatingRole(true);

    try {
      let newRole: UserRole;
      let body: { newRole: UserRole; transferPassword?: string } = { newRole: 'user' };

      switch (roleModal.action) {
        case 'grant':
          newRole = 'sub_admin';
          body = { newRole };
          break;
        case 'revoke':
          newRole = 'user';
          body = { newRole };
          break;
        case 'transfer':
          newRole = 'super_admin';
          body = { newRole, transferPassword };
          break;
        default:
          return;
      }

      const response = await fetch(`/api/admin/users/${roleModal.user.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setRoleModal({ open: false, user: null, action: 'grant' });
        setTransferPassword('');
        fetchUsers();
        if (roleModal.action === 'transfer') {
          alert('站主權限已轉讓，請重新登入');
          window.location.reload();
        }
      } else {
        alert(data.error || '操作失敗');
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert('操作失敗');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  // 刪除用戶
  const handleDelete = async () => {
    if (!deleteModal.user) return;
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/users/${deleteModal.user.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setDeleteModal({ open: false, user: null });
        fetchUsers();
        alert(`用戶 ${deleteModal.user.username} 已成功刪除`);
      } else {
        alert(data.error || '刪除失敗');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('刪除失敗');
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 flex items-center gap-1">
            <Crown className="w-3 h-3" />
            主管理員
          </span>
        );
      case 'sub_admin':
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 flex items-center gap-1">
            <Shield className="w-3 h-3" />
            副管理員
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            一般會員
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">會員管理</h1>

        {/* 搜尋和篩選 */}
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜尋暱稱或 Email..."
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </form>

          <button
            onClick={() => {
              setShowBlacklisted(!showBlacklisted);
              setPagination(p => ({ ...p, page: 1 }));
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${showBlacklisted
              ? 'bg-red-100 border-red-300 text-red-700 dark:bg-red-900/50 dark:border-red-700 dark:text-red-300'
              : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
          >
            <Ban className="w-4 h-4 inline mr-2" />
            {showBlacklisted ? '顯示全部' : '只看封鎖'}
          </button>

          <button
            onClick={fetchUsers}
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
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            沒有找到會員
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">會員</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">角色</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">評分</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">刊登數</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">註冊日期</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.custom_avatar_url || user.avatar_url || undefined}
                          size="sm"
                        />
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {user.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </td>
                    <td className="px-4 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {user.rating?.toFixed(1) || '-'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({user.review_count || 0})
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {user.listings_count}
                    </td>
                    <td className="px-4 py-4">
                      {user.is_blacklisted ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300">
                          已封鎖
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">
                          正常
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(user.created_at)}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="編輯"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {user.is_blacklisted ? (
                          <button
                            onClick={() => setUnblockModal({ open: true, user })}
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="解除封鎖"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openBlockModal(user)}
                            className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                            title="封鎖"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                        {/* 角色管理按鈕（僅主管理員可見，且不能編輯自己和其他主管理員）*/}
                        {isSuperAdmin && user.role !== 'super_admin' && (
                          <>
                            {user.role === 'user' ? (
                              <button
                                onClick={() => setRoleModal({ open: true, user, action: 'grant' })}
                                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg transition-colors"
                                title="授予副管理員"
                              >
                                <Shield className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => setRoleModal({ open: true, user, action: 'revoke' })}
                                className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="移除副管理員"
                              >
                                <ShieldOff className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setRoleModal({ open: true, user, action: 'transfer' })}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                              title="轉讓站主"
                            >
                              <Crown className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {/* 刪除按鈕（僅主管理員可見，且不能刪除管理員）*/}
                        {isSuperAdmin && user.role === 'user' && (
                          <button
                            onClick={() => setDeleteModal({ open: true, user })}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                            title="刪除用戶"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">編輯會員</h3>
              <button onClick={() => setEditModal({ open: false, user: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* 頭像 */}
              <div className="flex items-center gap-4">
                <Avatar
                  src={editModal.user?.custom_avatar_url || editModal.user?.avatar_url || undefined}
                  size="lg"
                />
                <button
                  onClick={() => setEditForm(f => ({ ...f, removeAvatar: !f.removeAvatar }))}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${editForm.removeAvatar
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                >
                  <ImageOff className="w-4 h-4" />
                  {editForm.removeAvatar ? '已標記移除' : '移除頭像'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">暱稱</label>
                <input
                  type="text"
                  value={editForm.username}
                  onChange={(e) => setEditForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="editNotify"
                  checked={editForm.notify}
                  onChange={(e) => setEditForm(f => ({ ...f, notify: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <label htmlFor="editNotify" className="text-sm text-gray-700 dark:text-gray-300">
                  通知用戶資料已被修改
                </label>
              </div>

              {editForm.notify && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">通知內容</label>
                  <textarea
                    value={editForm.notifyMessage}
                    onChange={(e) => setEditForm(f => ({ ...f, notifyMessage: e.target.value }))}
                    placeholder="您的帳號資料因違規已被管理員修改..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setEditModal({ open: false, user: null })}
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

      {/* 封鎖 Modal */}
      {blockModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-orange-600">封鎖用戶</h3>
              <button onClick={() => setBlockModal({ open: false, user: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                確定要封鎖「{blockModal.user?.username}」（{blockModal.user?.email}）嗎？
                <br />
                <span className="text-red-600 dark:text-red-400">此用戶將無法登入或註冊平台。</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">封鎖原因 *</label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="請輸入封鎖原因..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setBlockModal({ open: false, user: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleBlock}
                disabled={isBlocking || !blockReason}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isBlocking && <Loader2 className="w-4 h-4 animate-spin" />}
                確認封鎖
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 解封確認 Modal */}
      {unblockModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-green-600">解除封鎖</h3>
              <button onClick={() => setUnblockModal({ open: false, user: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                確定要解除「{unblockModal.user?.username}」（{unblockModal.user?.email}）的封鎖嗎？
                <br />
                解除後此用戶可以正常登入和使用平台。
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setUnblockModal({ open: false, user: null })}
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

      {/* 角色管理 Modal */}
      {roleModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className={`font-semibold ${roleModal.action === 'grant' ? 'text-purple-600' :
                roleModal.action === 'revoke' ? 'text-gray-600' :
                  'text-yellow-600'
                }`}>
                {roleModal.action === 'grant' && '授予副管理員權限'}
                {roleModal.action === 'revoke' && '移除副管理員權限'}
                {roleModal.action === 'transfer' && '轉讓站主權限'}
              </h3>
              <button
                onClick={() => {
                  setRoleModal({ open: false, user: null, action: 'grant' });
                  setTransferPassword('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {roleModal.action === 'grant' && (
                  <>
                    確定要將「{roleModal.user?.username}」設為副管理員嗎？
                    <br />
                    <span className="text-purple-600 dark:text-purple-400">副管理員可以進入後台管理刊登和會員。</span>
                  </>
                )}
                {roleModal.action === 'revoke' && (
                  <>
                    確定要移除「{roleModal.user?.username}」的副管理員權限嗎？
                    <br />
                    移除後此用戶將無法再進入管理後台。
                  </>
                )}
                {roleModal.action === 'transfer' && (
                  <>
                    <span className="text-red-600 dark:text-red-400 font-medium">警告：此操作不可逆！</span>
                    <br /><br />
                    確定要將站主權限轉讓給「{roleModal.user?.username}」嗎？
                    <br />
                    轉讓後您將降為副管理員，無法再執行此操作。
                  </>
                )}
              </div>

              {roleModal.action === 'transfer' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    請輸入轉讓密碼 *
                  </label>
                  <input
                    type="password"
                    value={transferPassword}
                    onChange={(e) => setTransferPassword(e.target.value)}
                    placeholder="請輸入站主轉讓密碼"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setRoleModal({ open: false, user: null, action: 'grant' });
                  setTransferPassword('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleRoleChange}
                disabled={isUpdatingRole || (roleModal.action === 'transfer' && !transferPassword)}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 flex items-center gap-2 ${roleModal.action === 'grant' ? 'bg-purple-600 hover:bg-purple-700' :
                  roleModal.action === 'revoke' ? 'bg-gray-600 hover:bg-gray-700' :
                    'bg-yellow-600 hover:bg-yellow-700'
                  }`}
              >
                {isUpdatingRole && <Loader2 className="w-4 h-4 animate-spin" />}
                {roleModal.action === 'grant' && '確認授予'}
                {roleModal.action === 'revoke' && '確認移除'}
                {roleModal.action === 'transfer' && '確認轉讓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 刪除確認 Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-red-600">刪除用戶</h3>
              <button onClick={() => setDeleteModal({ open: false, user: null })} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <span className="text-red-600 dark:text-red-400 font-medium">警告：此操作不可逆！</span>
                <br /><br />
                確定要刪除「{deleteModal.user?.username}」（{deleteModal.user?.email}）嗎？
                <br /><br />
                刪除後，該用戶的所有資料（包括刊登、訊息、評價等）都將被永久移除。
              </div>
            </div>
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setDeleteModal({ open: false, user: null })}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                確認刪除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
