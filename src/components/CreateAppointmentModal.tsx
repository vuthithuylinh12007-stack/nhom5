import React, { useState } from 'react';
import { X, Calendar, MapPin, Clock, Users, Sparkles } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CreateAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultPlaceId?: string;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  isOpen,
  onClose,
  defaultPlaceId
}) => {
  const { hangoutPlaces, friends, createAppointment } = useApp();

  const [title, setTitle] = useState('');
  const [selectedPlaceId, setSelectedPlaceId] = useState(defaultPlaceId || (hangoutPlaces[0]?.id ?? 'p1'));
  const [time, setTime] = useState('Thứ Bảy này, 16:00');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(friends.map(f => f.id));
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const place = hangoutPlaces.find(p => p.id === selectedPlaceId) || hangoutPlaces[0];
    createAppointment({
      title: title.trim() || `Hẹn tại ${place?.name || 'quán quen'}`,
      placeId: place?.id || 'p1',
      placeName: place?.name || 'Quán cà phê bạn thân',
      placeAddress: place?.address || 'Hà Nội',
      time,
      attendeeIds: selectedFriendIds,
      notes
    });
    onClose();
  };

  const toggleFriend = (id: string) => {
    setSelectedFriendIds(prev =>
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-pink-500 text-white flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Tạo lịch hẹn Bestie</h2>
              <p className="text-xs text-slate-500">Lên kèo gặp mặt hội bạn thân</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên buổi hẹn:
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Trà sữa chém gió sau giờ học"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Chọn địa điểm:
            </label>
            <select
              value={selectedPlaceId}
              onChange={(e) => setSelectedPlaceId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400 bg-white"
            >
              {hangoutPlaces.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} - {p.categoryName} ({p.address})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Thời gian gặp gỡ:
            </label>
            <input
              type="text"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              placeholder="VD: Chủ Nhật, 17:30"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Mời bạn bè tham gia:
            </label>
            <div className="flex flex-wrap gap-2">
              {friends.map((friend) => {
                const isSelected = selectedFriendIds.includes(friend.id);
                return (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => toggleFriend(friend.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 text-purple-900'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                    }`}
                  >
                    <img
                      src={friend.avatar}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span>{friend.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Ghi chú thêm:
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="VD: Nhớ mang theo boardgame nhé!"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
            />
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
              className="flex-1 py-2.5 text-xs font-semibold text-white bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tạo lịch hẹn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
