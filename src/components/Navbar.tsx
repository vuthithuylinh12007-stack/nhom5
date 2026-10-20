import React from 'react';
import { Sparkles, MapPin, Gamepad2, Video, Users, Settings, Plus, Wifi, WifiOff } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenCreateRoom: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenCreateRoom }) => {
  const { currentUser, wsConnected, setOpenConfigModal } = useApp();

  return (
    <>
      {/* Top Navigation Bar: Strict 3-zone contract */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-purple-100 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 text-left focus:outline-hidden"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-400 flex items-center justify-center text-white shadow-sm shadow-purple-200">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-purple-700 via-purple-600 to-pink-600 bg-clip-text text-transparent whitespace-nowrap">
                  MyBestie
                </span>
                <span className="hidden sm:inline-block ml-2 text-xs font-normal text-purple-400">
                  Kết nối hội bạn thân
                </span>
              </div>
            </button>
          </div>

          {/* Zone 2: 5 concise single-line nav links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('home')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'home'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent hover:text-purple-600'
              }`}
            >
              Trang chủ
            </button>
            <button
              onClick={() => setActiveTab('map')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'map'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent hover:text-purple-600'
              }`}
            >
              Bản đồ
            </button>
            <button
              onClick={() => setActiveTab('games')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'games'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent hover:text-purple-600'
              }`}
            >
              Trò chơi
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'video'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent hover:text-purple-600'
              }`}
            >
              Gọi video
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className={`transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
                activeTab === 'friends'
                  ? 'border-purple-600 text-purple-700 font-semibold'
                  : 'border-transparent hover:text-purple-600'
              }`}
            >
              Bạn bè
            </button>
          </nav>

          {/* Zone 3: 1 primary action area */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setOpenConfigModal(true)}
              title="Hướng dẫn & Cài đặt API"
              className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenCreateRoom}
              className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl hover:from-purple-700 hover:to-pink-600 shadow-xs shadow-purple-200 transition-all whitespace-nowrap shrink-0 active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tạo phòng chơi</span>
            </button>

            <button
              onClick={() => setActiveTab('friends')}
              className="flex items-center gap-2 pl-2 pr-3 py-1 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors text-xs font-medium text-purple-900 border border-purple-200/60"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-6 h-6 rounded-full object-cover border border-white"
              />
              <span className="hidden lg:inline max-w-[90px] truncate">{currentUser.name}</span>
              {wsConnected ? (
                <span title="Đã kết nối thời gian thực">
                  <Wifi className="w-3 h-3 text-emerald-500 shrink-0" />
                </span>
              ) : (
                <span title="Đang kết nối lại...">
                  <WifiOff className="w-3 h-3 text-amber-500 shrink-0" />
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-purple-100 px-3 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
            activeTab === 'home' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span>Trang chủ</span>
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
            activeTab === 'map' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <MapPin className="w-5 h-5" />
          <span>Bản đồ</span>
        </button>
        <button
          onClick={() => setActiveTab('games')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
            activeTab === 'games' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <Gamepad2 className="w-5 h-5" />
          <span>Trò chơi</span>
        </button>
        <button
          onClick={() => setActiveTab('video')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
            activeTab === 'video' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <Video className="w-5 h-5" />
          <span>Gọi video</span>
        </button>
        <button
          onClick={() => setActiveTab('friends')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg text-xs font-medium ${
            activeTab === 'friends' ? 'text-purple-600' : 'text-slate-500'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Bạn bè</span>
        </button>
      </nav>
    </>
  );
};
