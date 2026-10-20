import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Search,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Video,
  MapPin,
  Shield,
  Edit3,
  LogOut,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface FriendsViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreateRoom: () => void;
}

export const FriendsView: React.FC<FriendsViewProps> = ({ onNavigate, onOpenCreateRoom }) => {
  const {
    currentUser,
    allUsers,
    friends,
    friendRequests,
    setCurrentUser,
    switchUserById,
    sendFriendRequest,
    respondFriendRequest,
    isSharingLocation,
    toggleLocationSharing,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'list' | 'requests' | 'search' | 'profile'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  // Profile Edit State
  const [editName, setEditName] = useState(currentUser.name);
  const [editStatus, setEditStatus] = useState(currentUser.statusText);

  // Auth form state (Register/Login modal or inline)
  const [authMode, setAuthMode] = useState<'none' | 'login' | 'register'>('none');
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated = {
      ...currentUser,
      name: editName.trim() || currentUser.name,
      statusText: editStatus.trim() || currentUser.statusText
    };
    setCurrentUser(updated);
    showToast('Đã lưu thay đổi thông tin cá nhân! ✨');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authMode === 'login') {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail })
        });
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          showToast(`Đăng nhập thành công! Chào ${data.user.name}`);
          setAuthMode('none');
        } else {
          showToast(data.message || 'Email không tồn tại');
        }
      } catch (err) {
        showToast('Đã đăng nhập demo thành công!');
        setAuthMode('none');
      }
    } else if (authMode === 'register') {
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: authName, email: authEmail })
        });
        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          showToast(`Đăng ký thành công! Chào mừng bạn đến MyBestie! 🎉`);
          setAuthMode('none');
        } else {
          showToast(data.message || 'Không thể đăng ký');
        }
      } catch (err) {
        showToast('Đã tạo tài khoản demo!');
        setAuthMode('none');
      }
    }
  };

  const filteredSearchUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser.id &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-600" />
            <span>Hội Bạn Thân & Hồ Sơ</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối, gửi lời mời và quản lý quyền riêng tư chia sẻ vị trí
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-2xl border border-purple-200 text-xs font-semibold overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'list' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            Bạn bè ({friends.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap relative ${
              activeTab === 'requests' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            Lời mời {friendRequests.length > 0 && `(${friendRequests.length})`}
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'search' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            Tìm bạn mới
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'profile' ? 'bg-purple-600 text-white shadow-xs' : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            Hồ sơ cá nhân
          </button>
        </div>
      </div>

      {/* SUBTAB 1: DANH SÁCH BẠN BÈ */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map((friend) => (
              <div
                key={friend.id}
                className="bg-white rounded-2xl p-5 border border-purple-100 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-purple-100"
                    />
                    <span
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                        friend.isOnline ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-slate-800 truncate">{friend.name}</h3>
                    <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                    <p className="text-xs text-purple-700 italic mt-1 line-clamp-1">
                      "{friend.statusText}"
                    </p>
                  </div>
                </div>

                {friend.location?.isSharing && (
                  <div className="p-2 bg-purple-50 rounded-xl text-[11px] text-purple-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
                    <span>Đang chia sẻ tọa độ (Hà Nội)</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onOpenCreateRoom();
                      showToast(`Đã gửi lời mời chơi game đến ${friend.name}!`);
                    }}
                    className="py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Mời chơi</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('video');
                      showToast(`Đang mở cuộc gọi tới ${friend.name}...`);
                    }}
                    className="py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Gọi video</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: LỜI MỜI KẾT BẠN */}
      {activeTab === 'requests' && (
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-800">
            Lời mời kết bạn đang chờ ({friendRequests.length})
          </h3>

          {friendRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Mail className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-xs">Hiện tại bạn không có lời mời kết bạn nào.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.map((req) => {
                const sender = allUsers.find((u) => u.id === req.fromId) || {
                  id: req.fromId,
                  name: 'Bạn mới',
                  email: 'bestie@vn',
                  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=new'
                };

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={sender.avatar}
                        alt={sender.name}
                        referrerPolicy="no-referrer"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-800">{sender.name}</span>
                        <p className="text-xs text-slate-500">Muốn trở thành Bestie của bạn</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => respondFriendRequest(req.id, true)}
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Đồng ý</span>
                      </button>
                      <button
                        onClick={() => respondFriendRequest(req.id, false)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-colors"
                      >
                        Từ chối
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 3: TÌM BẠN MỚI */}
      {activeTab === 'search' && (
        <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nhập tên hoặc email bạn bè để tìm kiếm..."
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white"
            />
          </div>

          <div className="space-y-3 pt-2">
            {filteredSearchUsers.map((u) => {
              const isAlreadyFriend = friends.some((f) => f.id === u.id);

              return (
                <div
                  key={u.id}
                  className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-purple-200"
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-800">{u.name}</span>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>

                  {isAlreadyFriend ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg flex items-center gap-1 border border-emerald-200">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Đã là bạn bè</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => sendFriendRequest(u.id)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Kết bạn</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBTAB 4: HỒ SƠ CÁ NHÂN & QUYỀN RIÊNG TƯ */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Profile Card & Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-6">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-16 h-16 rounded-3xl object-cover border-2 border-purple-300 shadow-sm"
              />
              <div>
                <h3 className="text-lg font-bold text-slate-800">{currentUser.name}</h3>
                <p className="text-xs text-slate-500">{currentUser.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-[11px] font-semibold text-emerald-700">Tài khoản hoạt động</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên hiển thị:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Dòng trạng thái / Mood hôm nay:
                </label>
                <input
                  type="text"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  placeholder="VD: Đang rảnh, ai hẹn cà phê không?"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Lưu thông tin cá nhân</span>
              </button>
            </form>

            {/* Privacy Section */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-600" />
                <span>Quyền riêng tư & Chia sẻ vị trí</span>
              </h4>

              <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between gap-4">
                <div>
                  <span className="font-bold text-slate-800 block text-xs">
                    Chia sẻ vị trí với bạn bè
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Chỉ những bạn bè đã kết nối mới nhìn thấy vị trí của bạn trên bản đồ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleLocationSharing()}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                    isSharingLocation
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-purple-600 text-white'
                  }`}
                >
                  {isSharingLocation ? 'Tắt chia sẻ' : 'Bật chia sẻ'}
                </button>
              </div>
            </div>
          </div>

          {/* Account Switching & Login Modal trigger */}
          <div className="lg:col-span-5 bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-xs space-y-5">
            <div>
              <h4 className="font-bold text-base text-slate-800">Quản lý Tài Khoản</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Chuyển đổi giữa các Bestie để kiểm tra trò chơi đối kháng hoặc đăng ký tài khoản mới.
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 block">
                Chuyển nhanh tài khoản demo:
              </span>
              <div className="space-y-1.5">
                {allUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => switchUserById(u.id)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      u.id === currentUser.id
                        ? 'border-purple-600 bg-purple-50 font-bold text-purple-900'
                        : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        referrerPolicy="no-referrer"
                        className="w-6 h-6 rounded-full object-cover"
                      />
                      <span className="text-xs">{u.name}</span>
                    </div>
                    {u.id === currentUser.id && (
                      <span className="text-[10px] text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                        Đang chọn
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Login / Register Toggle */}
            <div className="pt-2 border-t border-slate-200 space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setAuthMode(authMode === 'login' ? 'none' : 'login')}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Đăng nhập tài khoản khác
                </button>
                <button
                  onClick={() => setAuthMode(authMode === 'register' ? 'none' : 'register')}
                  className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Đăng ký mới
                </button>
              </div>

              {authMode !== 'none' && (
                <form onSubmit={handleAuthSubmit} className="p-4 bg-white rounded-2xl border border-purple-200 space-y-3 text-xs">
                  <span className="font-bold text-purple-900 block">
                    {authMode === 'login' ? 'Đăng nhập vào MyBestie' : 'Tạo tài khoản MyBestie mới'}
                  </span>

                  {authMode === 'register' && (
                    <div>
                      <label className="block text-slate-600 mb-1">Tên của bạn:</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="VD: Khánh Huyền"
                        className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-600 mb-1">Email:</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="VD: banthan@bestie.vn"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold rounded-lg shadow-xs"
                  >
                    {authMode === 'login' ? 'Đăng nhập' : 'Hoàn tất đăng ký'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
