import React, { useState } from 'react';
import { X, Gamepad2, Users, Sparkles, Copy, CheckCircle2 } from 'lucide-react';
import { GameType } from '../types';
import { useApp } from '../context/AppContext';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoinCreatedRoom: (roomId: string, gameType: GameType) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onJoinCreatedRoom }) => {
  const { currentUser, showToast } = useApp();
  const [gameType, setGameType] = useState<GameType>('caro');
  const [roomName, setRoomName] = useState('');
  const [roomCode] = useState(() => `BESTIE-${Math.floor(1000 + Math.random() * 9000)}`);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setIsCopied(true);
    showToast('Đã sao chép mã phòng!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = roomName.trim() || `Phòng ${gameType.toUpperCase()} của ${currentUser.name}`;
    onJoinCreatedRoom(roomCode, gameType);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tạo phòng chơi mới</h2>
              <p className="text-xs text-slate-500">Mời hội bạn cùng tham gia tranh tài</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Chọn trò chơi:
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setGameType('caro')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  gameType === 'caro'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                    : 'border-slate-200 hover:border-purple-300 text-slate-700'
                }`}
              >
                <span className="text-base">⭕❌ Cờ Caro</span>
                <span className="text-[11px] font-normal text-slate-500">Đối kháng 5 nước thắng</span>
              </button>

              <button
                type="button"
                onClick={() => setGameType('rps')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  gameType === 'rps'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                    : 'border-slate-200 hover:border-purple-300 text-slate-700'
                }`}
              >
                <span className="text-base">✌️✊✋ Oẳn Tù Tì</span>
                <span className="text-[11px] font-normal text-slate-500">Kéo - Búa - Bao đọ tay</span>
              </button>

              <button
                type="button"
                onClick={() => setGameType('quiz')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  gameType === 'quiz'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                    : 'border-slate-200 hover:border-purple-300 text-slate-700'
                }`}
              >
                <span className="text-base">🧠 Đố Vui Bestie</span>
                <span className="text-[11px] font-normal text-slate-500">Ai hiểu bạn bè nhất</span>
              </button>

              <button
                type="button"
                onClick={() => setGameType('draw')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                  gameType === 'draw'
                    ? 'border-purple-600 bg-purple-50 text-purple-900 font-semibold'
                    : 'border-slate-200 hover:border-purple-300 text-slate-700'
                }`}
              >
                <span className="text-base">🎨 Đoán Từ & Hình</span>
                <span className="text-[11px] font-normal text-slate-500">Vẽ trực tiếp trên bảng</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tên phòng chơi:
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder={`Phòng của ${currentUser.name}`}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mã phòng tự động tạo:
            </label>
            <div className="flex items-center gap-2 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
              <span className="flex-1 font-mono font-bold text-sm text-purple-700 pl-2">
                {roomCode}
              </span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-2.5 py-1 text-xs bg-white text-slate-700 hover:text-purple-700 rounded-lg shadow-2xs border border-slate-200 flex items-center gap-1 transition-colors"
              >
                {isCopied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Gửi mã này cho bạn bè để cùng tham gia phòng trực tuyến theo thời gian thực.
            </p>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vào phòng ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
