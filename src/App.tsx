/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './views/HomeView';
import { MapView } from './views/MapView';
import { GamesView } from './views/GamesView';
import { VideoCallView } from './views/VideoCallView';
import { FriendsView } from './views/FriendsView';
import { ConfigGuideModal } from './components/ConfigGuideModal';
import { CreateRoomModal } from './components/CreateRoomModal';
import { CreateAppointmentModal } from './components/CreateAppointmentModal';
import { Sparkles, Heart } from 'lucide-react';
import { GameType } from './types';

function MainApp() {
  const [activeTab, setActiveTab] = useState<'home' | 'map' | 'games' | 'video' | 'friends'>('home');
  const [isCreateRoomOpen, setIsCreateRoomOpen] = useState(false);
  const [isCreateAppointmentOpen, setIsCreateAppointmentOpen] = useState(false);
  const [appointmentDefaultPlaceId, setAppointmentDefaultPlaceId] = useState<string | undefined>(undefined);
  const [pendingRoomCode, setPendingRoomCode] = useState<string | undefined>(undefined);

  const { toastMessage, openConfigModal, setOpenConfigModal } = useApp();

  const handleOpenAppointmentModal = (placeId?: string) => {
    setAppointmentDefaultPlaceId(placeId);
    setIsCreateAppointmentOpen(true);
  };

  const handleJoinCreatedRoom = (code: string, _gameType: GameType) => {
    setPendingRoomCode(code);
    setActiveTab('games');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#faf7fd] text-slate-800 selection:bg-purple-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm px-4 py-3 bg-slate-900/90 text-white text-xs font-semibold rounded-2xl shadow-xl backdrop-blur-md border border-white/20 animate-fade-in flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab as 'home' | 'map' | 'games' | 'video' | 'friends')}
        onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
      />

      {/* Main View Port Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-20">
        {activeTab === 'home' && (
          <HomeView
            onNavigate={(tab) => setActiveTab(tab as any)}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
            onOpenCreateAppointment={() => handleOpenAppointmentModal()}
          />
        )}

        {activeTab === 'map' && (
          <MapView onOpenCreateAppointment={handleOpenAppointmentModal} />
        )}

        {activeTab === 'games' && (
          <GamesView
            initialRoomCode={pendingRoomCode}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
          />
        )}

        {activeTab === 'video' && <VideoCallView />}

        {activeTab === 'friends' && (
          <FriendsView
            onNavigate={(tab) => setActiveTab(tab as any)}
            onOpenCreateRoom={() => setIsCreateRoomOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <ConfigGuideModal
        isOpen={openConfigModal}
        onClose={() => setOpenConfigModal(false)}
      />

      <CreateRoomModal
        isOpen={isCreateRoomOpen}
        onClose={() => setIsCreateRoomOpen(false)}
        onJoinCreatedRoom={handleJoinCreatedRoom}
      />

      <CreateAppointmentModal
        isOpen={isCreateAppointmentOpen}
        onClose={() => setIsCreateAppointmentOpen(false)}
        defaultPlaceId={appointmentDefaultPlaceId}
      />

      {/* Minimal Anti-Slop Footer */}
      <footer className="border-t border-purple-100 bg-white/70 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-semibold text-purple-900">
            MyBestie – Gần nhau hơn, vui cùng nhau mỗi ngày!
          </span>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Dành cho hội bạn thân với</span>
            <Heart className="w-3.5 h-3.5 text-pink-500 inline fill-pink-500" />
            <span>và công nghệ thời gian thực.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
