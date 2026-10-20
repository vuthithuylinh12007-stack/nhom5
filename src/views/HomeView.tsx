import React from 'react';
import {
  Sparkles,
  MapPin,
  Gamepad2,
  Video,
  Users,
  Calendar,
  ArrowRight,
  Coffee,
  MessageCircle,
  Radio,
  Flame,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface HomeViewProps {
  onNavigate: (tab: string) => void;
  onOpenCreateRoom: () => void;
  onOpenCreateAppointment: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigate,
  onOpenCreateRoom,
  onOpenCreateAppointment
}) => {
  const { currentUser, friends, allUsers, appointments, switchUserById, showToast } = useApp();

  return (
    <div className="space-y-8 pb-16">
      {/* Hero Welcome Card */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15 mix-blend-overlay">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-10 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold text-purple-100">
              <Sparkles className="w-3.5 h-3.5 text-pink-200" />
              <span>Gần nhau hơn, vui cùng nhau mỗi ngày!</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Xin chào, <span className="text-pink-200">{currentUser.name}</span>!
            </h1>

            <p className="text-purple-100 text-sm sm:text-base max-w-xl leading-relaxed">
              Hội bạn thân đang rôm rả! Khám phá ngay các địa điểm cà phê yêu thích, tham gia phòng chơi cờ caro & đố vui trực tuyến, hoặc mở cuộc gọi video hội ngộ ngay.
            </p>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('map')}
                className="px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center gap-2 active:scale-95"
              >
                <MapPin className="w-4 h-4 text-purple-600" />
                <span>Mở bản đồ điểm hẹn</span>
              </button>

              <button
                onClick={onOpenCreateRoom}
                className="px-5 py-2.5 bg-purple-900/40 hover:bg-purple-900/60 border border-white/30 text-white font-bold text-xs sm:text-sm rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <Gamepad2 className="w-4 h-4 text-pink-300" />
                <span>Tạo phòng game</span>
              </button>

              <button
                onClick={() => onNavigate('video')}
                className="px-5 py-2.5 bg-pink-500/80 hover:bg-pink-500 text-white font-bold text-xs sm:text-sm rounded-xl backdrop-blur-sm transition-all flex items-center gap-2 active:scale-95"
              >
                <Video className="w-4 h-4" />
                <span>Gọi video</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-sm rounded-2xl overflow-hidden shadow-2xl border-2 border-white/30 group">
              <img
                src="/src/assets/images/hero_bestie_hangout_1791969349249.jpg"
                alt="Hội bạn thân MyBestie tụ họp"
                referrerPolicy="no-referrer"
                className="w-full h-56 sm:h-64 object-cover object-center transform group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4">
                <span className="text-xs font-semibold text-pink-200">Khoảnh khắc Bestie</span>
                <p className="text-xs text-white/90">
                  “Bạn thân là người dù không gặp mỗi ngày, gặp lại vẫn cứ rôm rả như chưa hề cách xa.”
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Switch Demo User bar (Helpful for testing on one device) */}
      <section className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-bold text-slate-700">Đang đăng nhập với:</span>
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-800 rounded-lg font-semibold border border-purple-200">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-4 h-4 rounded-full object-cover"
            />
            <span>{currentUser.name} ({currentUser.email})</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500">Đổi tài khoản demo để thử nghiệm nhiều người:</span>
          <div className="flex gap-1.5">
            {allUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => switchUserById(u.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  u.id === currentUser.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Friends Status Carousel */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              <span>Hội bạn thân ({friends.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Trạng thái trực tuyến và chia sẻ vị trí của các cạ cứng
            </p>
          </div>
          <button
            onClick={() => onNavigate('friends')}
            className="text-xs font-semibold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            <span>Xem tất cả</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {friends.map((friend) => (
            <div
              key={friend.id}
              className="bg-white rounded-2xl p-4 border border-purple-100 shadow-xs hover:shadow-md transition-shadow flex items-start gap-3.5"
            >
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
                  title={friend.isOnline ? 'Đang online' : 'Ngoại tuyến'}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-slate-800 truncate">{friend.name}</h3>
                  <span className="text-[11px] text-slate-400">
                    {friend.isOnline ? 'Trực tuyến' : 'Vừa rời đi'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 italic mt-0.5 line-clamp-1">
                  "{friend.statusText}"
                </p>

                {friend.location?.isSharing && (
                  <div className="mt-1.5 flex items-center gap-1 text-[11px] text-purple-600 font-medium">
                    <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
                    <span className="truncate">Đang chia sẻ vị trí gần Hoàn Kiếm</span>
                  </div>
                )}

                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onOpenCreateRoom();
                      showToast(`Đã gửi lời mời tham gia phòng game đến ${friend.name}!`);
                    }}
                    className="flex-1 py-1.5 px-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Gamepad2 className="w-3.5 h-3.5" />
                    <span>Rủ chơi</span>
                  </button>
                  <button
                    onClick={() => {
                      onNavigate('video');
                      showToast(`Đang kết nối gọi video với ${friend.name}...`);
                    }}
                    className="flex-1 py-1.5 px-2 bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Gọi video</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Grid: Upcoming Appointments & Interactive Games Quickplay */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Appointments Section */}
        <section className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-base">Kèo tụ họp sắp tới</h3>
                <p className="text-xs text-slate-500">Các cuộc hẹn được hội bạn lên lịch</p>
              </div>
            </div>
            <button
              onClick={onOpenCreateAppointment}
              className="text-xs font-semibold px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors"
            >
              + Tạo kèo mới
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((apt) => (
              <div
                key={apt.id}
                className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/60 to-pink-50/60 border border-purple-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{apt.title}</span>
                    <span className="text-[11px] font-semibold text-purple-600 bg-white px-2 py-0.5 rounded-full border border-purple-200">
                      {apt.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <Coffee className="w-3.5 h-3.5 text-purple-500" />
                    <span>{apt.placeName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500 truncate max-w-xs">{apt.placeAddress}</span>
                  </div>
                  {apt.notes && (
                    <p className="text-[11px] text-slate-500 italic mt-0.5">
                      Ghi chú: {apt.notes}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onNavigate('map')}
                    className="px-3 py-1.5 bg-white text-purple-700 text-xs font-semibold rounded-lg shadow-2xs border border-purple-200 hover:bg-purple-50 transition-colors flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5 text-pink-500" />
                    <span>Xem vị trí</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Mini-games Banner */}
        <section className="lg:col-span-5 bg-gradient-to-br from-purple-50 via-white to-pink-50 rounded-3xl p-6 border border-purple-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 bg-purple-600 text-white rounded-lg">
                <Gamepad2 className="w-4 h-4" />
              </span>
              <h3 className="font-bold text-slate-800 text-base">Kho trò chơi Bestie</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tranh tài oẳn tù tì, cờ caro đối kháng, đố vui bạn thân và thử tài vẽ hình đoán chữ. Đồng bộ thời gian thực qua máy chủ backend WebSocket!
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div
                onClick={() => onNavigate('games')}
                className="p-2.5 bg-white rounded-xl border border-purple-100 flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">⭕❌</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Cờ Caro Đối Kháng</span>
                    <span className="text-[11px] text-slate-500">5 nước thắng · Hỗ trợ chơi online & chơi cùng máy</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>

              <div
                onClick={() => onNavigate('games')}
                className="p-2.5 bg-white rounded-xl border border-purple-100 flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">✌️✊✋</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Oẳn Tù Tì Bestie</span>
                    <span className="text-[11px] text-slate-500">Kéo búa bao đọ may mắn · Tính điểm tức thời</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>

              <div
                onClick={() => onNavigate('games')}
                className="p-2.5 bg-white rounded-xl border border-purple-100 flex items-center justify-between cursor-pointer hover:border-purple-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">🎨🖌️</span>
                  <div>
                    <span className="font-bold text-slate-800 block">Đoán Từ & Đoán Hình</span>
                    <span className="text-[11px] text-slate-500">Bảng vẽ trực tuyến real-time · Đoán từ nhận điểm</span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('games')}
            className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs hover:from-purple-700 hover:to-pink-600 transition-all flex items-center justify-center gap-2"
          >
            <span>Vào sảnh trò chơi ngay</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </section>
      </div>
    </div>
  );
};
