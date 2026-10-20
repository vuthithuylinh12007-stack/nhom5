import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Coffee,
  Utensils,
  GraduationCap,
  Sparkles,
  Navigation,
  Share2,
  Calendar,
  AlertTriangle,
  Key,
  Info,
  ExternalLink,
  LocateFixed
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HangoutPlace } from '../types';

interface MapViewProps {
  onOpenCreateAppointment: (placeId?: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({ onOpenCreateAppointment }) => {
  const {
    hangoutPlaces,
    friends,
    currentUser,
    googleMapsApiKey,
    isSharingLocation,
    userCoords,
    toggleLocationSharing,
    setOpenConfigModal,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPlace, setSelectedPlace] = useState<HangoutPlace | null>(hangoutPlaces[0] || null);

  // Filtered places
  const filteredPlaces = hangoutPlaces.filter((place) => {
    const matchCategory = selectedCategory === 'all' || place.category === selectedCategory;
    const matchQuery =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchQuery;
  });

  // Calculate distance in km (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cafe':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      case 'restaurant':
        return <Utensils className="w-4 h-4 text-rose-500" />;
      case 'school':
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner / API Key Notice */}
      {!googleMapsApiKey ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-900">
                Giao diện bản đồ dự phòng (Chưa kích hoạt Google Maps API Key)
              </p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                Ứng dụng đang hiển thị chế độ danh mục địa điểm và vị trí thực tế của hội bạn. Để hiển thị bản đồ vệ tinh của Google, hãy thêm API Key trong cài đặt.
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenConfigModal(true)}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Cấu hình API Key</span>
          </button>
        </div>
      ) : (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl px-4 py-2.5 text-xs text-purple-800 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Info className="w-4 h-4 text-purple-600" />
            Google Maps API Key đã được thiết lập thành công.
          </span>
          <button
            onClick={() => setOpenConfigModal(true)}
            className="text-purple-700 hover:underline font-semibold"
          >
            Thay đổi
          </button>
        </div>
      )}

      {/* Location Sharing Controller & Controls */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              <span>Bản đồ & Tọa độ Bạn thân</span>
            </h2>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isSharingLocation
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {isSharingLocation ? 'Đang chia sẻ vị trí' : 'Vị trí đang ẩn'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {isSharingLocation
              ? 'Tọa độ hiện tại của bạn đang được chia sẻ an toàn với các bạn bè trong danh sách.'
              : 'Vị trí của bạn hoàn toàn riêng tư. Nhấn "Bật chia sẻ" khi muốn hội bạn biết bạn đang ở đâu.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => toggleLocationSharing()}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs ${
              isSharingLocation
                ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                : 'bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'
            }`}
          >
            <LocateFixed className="w-4 h-4" />
            <span>{isSharingLocation ? 'Tắt chia sẻ vị trí' : 'Bật chia sẻ vị trí'}</span>
          </button>

          <button
            onClick={() => onOpenCreateAppointment(selectedPlace?.id)}
            className="px-4 py-2.5 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs rounded-xl border border-purple-200 transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Tạo điểm hẹn</span>
          </button>
        </div>
      </div>

      {/* Main Map & Places Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Search & Place List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm quán cà phê, nhà hàng, trà sữa..."
                className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white"
              />
            </div>

            {/* Categories filter tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setSelectedCategory('cafe')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === 'cafe'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Coffee className="w-3 h-3" />
                <span>Quán cà phê</span>
              </button>
              <button
                onClick={() => setSelectedCategory('restaurant')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === 'restaurant'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Utensils className="w-3 h-3" />
                <span>Nhà hàng</span>
              </button>
              <button
                onClick={() => setSelectedCategory('entertainment')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === 'entertainment'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Vui chơi</span>
              </button>
              <button
                onClick={() => setSelectedCategory('school')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1 ${
                  selectedCategory === 'school'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <GraduationCap className="w-3 h-3" />
                <span>Trường học</span>
              </button>
            </div>
          </div>

          {/* Place Cards List */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {filteredPlaces.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center text-slate-400 border border-slate-100">
                <p className="text-xs">Không tìm thấy địa điểm phù hợp</p>
              </div>
            ) : (
              filteredPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const dist = userCoords
                  ? calculateDistance(userCoords.lat, userCoords.lng, place.lat, place.lng)
                  : null;

                return (
                  <div
                    key={place.id}
                    onClick={() => setSelectedPlace(place)}
                    className={`bg-white rounded-2xl p-4 border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-purple-600 ring-2 ring-purple-100 shadow-md'
                        : 'border-purple-100 hover:border-purple-200 shadow-xs'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-xl bg-purple-50 shrink-0">
                          {getCategoryIcon(place.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-800">{place.name}</h3>
                          <span className="text-[11px] text-purple-600 font-medium">
                            {place.categoryName}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-md">
                        ⭐ {place.rating}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-2 line-clamp-1">{place.address}</p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      {place.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                        >
                          {t}
                        </span>
                      ))}
                      {dist && (
                        <span className="ml-auto text-[11px] font-semibold text-purple-600 flex items-center gap-1">
                          <Navigation className="w-3 h-3" />
                          <span>Cách {dist} km</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Visual Map Display */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-purple-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-base text-slate-800">
                  {selectedPlace ? selectedPlace.name : 'Khu vực Hoàn Kiếm, Hà Nội'}
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedPlace?.address || 'Tọa độ trung tâm kết nối'}
                </p>
              </div>

              {selectedPlace && (
                <button
                  onClick={() => onOpenCreateAppointment(selectedPlace.id)}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs hover:from-purple-700 hover:to-pink-600 transition-all flex items-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Hẹn tại đây</span>
                </button>
              )}
            </div>

            {/* Interactive Radar Visual Canvas for Location & Friends */}
            <div className="relative w-full h-[400px] rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900 to-purple-950 p-4 border border-purple-900 shadow-inner flex flex-col justify-between">
              {/* Grid backdrop */}
              <div className="absolute inset-0 opacity-20 pointer-events-none">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
                  <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
                  <line x1="50" y1="0" x2="50" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
                  <line x1="0" y1="50" x2="100" y2="50" stroke="currentColor" strokeWidth="0.5" className="text-purple-400" />
                </svg>
              </div>

              {/* Map Controls Floating Badge */}
              <div className="relative z-10 flex items-center justify-between text-xs text-white/90">
                <span className="px-2.5 py-1 bg-black/40 backdrop-blur-md rounded-lg border border-white/10 font-mono">
                  📍 21.0285° N, 105.8542° E
                </span>
                <span className="px-2.5 py-1 bg-purple-600/80 backdrop-blur-md rounded-lg font-medium">
                  {friends.filter((f) => f.location?.isSharing).length} bạn bè đang chia sẻ vị trí
                </span>
              </div>

              {/* Pins on the Map */}
              <div className="relative z-10 inset-0 flex items-center justify-center my-auto">
                {/* Center / User Location */}
                <div className="relative flex flex-col items-center">
                  <div className="relative">
                    <span className="absolute -inset-2 bg-pink-500 rounded-full animate-ping opacity-40" />
                    <div className="w-9 h-9 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center shadow-lg text-white font-bold text-xs">
                      Bạn
                    </div>
                  </div>
                  <span className="mt-1 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded text-[10px] text-pink-200 whitespace-nowrap">
                    {currentUser.name} {isSharingLocation ? '(Đang bật)' : '(Ẩn)'}
                  </span>
                </div>

                {/* Friend Pin 1: Minh Khởi (Bách Khoa) */}
                <div className="absolute transform translate-x-32 translate-y-20 flex flex-col items-center">
                  <img
                    src="/src/assets/images/avatar_minh_khoi_1791969350797.jpg"
                    alt="Minh Khởi"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border-2 border-emerald-400 object-cover shadow-md"
                  />
                  <span className="mt-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white">
                    Minh Khởi (1.8km)
                  </span>
                </div>

                {/* Friend Pin 2: Ngọc Ánh (Cầu Giấy) */}
                <div className="absolute transform -translate-x-36 -translate-y-16 flex flex-col items-center">
                  <img
                    src="/src/assets/images/avatar_ngoc_anh_1791969350770.jpg"
                    alt="Ngọc Ánh"
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full border-2 border-emerald-400 object-cover shadow-md"
                  />
                  <span className="mt-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-white">
                    Ngọc Ánh (3.2km)
                  </span>
                </div>

                {/* Selected Place Pin */}
                {selectedPlace && (
                  <div className="absolute transform translate-x-12 -translate-y-24 flex flex-col items-center animate-bounce">
                    <div className="p-2 rounded-full bg-amber-400 text-slate-900 border-2 border-white shadow-xl">
                      {getCategoryIcon(selectedPlace.category)}
                    </div>
                    <span className="mt-1 px-2 py-0.5 bg-amber-400 text-slate-900 font-bold rounded text-[10px] shadow-sm whitespace-nowrap">
                      {selectedPlace.name}
                    </span>
                  </div>
                )}
              </div>

              {/* Bottom Info bar */}
              <div className="relative z-10 p-3 bg-black/50 backdrop-blur-md rounded-xl border border-white/10 flex items-center justify-between text-xs text-slate-200">
                <div className="flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>
                    Chỉ bạn bè mà bạn đã đồng ý mới xem được vị trí của bạn trên hệ thống.
                  </span>
                </div>
                <button
                  onClick={() => showToast('Đã gửi thông báo vị trí hiện tại đến hội bạn!')}
                  className="px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-white font-medium text-[11px] transition-colors"
                >
                  Gửi vị trí
                </button>
              </div>
            </div>
          </div>

          {/* Place details footer */}
          {selectedPlace && (
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-bold text-slate-800 text-sm">{selectedPlace.name}</span>
                <p className="text-slate-600">{selectedPlace.address}</p>
                <div className="flex gap-2 pt-1 text-purple-700 font-medium">
                  {selectedPlace.tags.map((t, idx) => (
                    <span key={idx}>#{t}</span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      selectedPlace.name + ' ' + selectedPlace.address
                    )}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2 bg-white text-slate-700 hover:text-purple-700 font-medium rounded-xl border border-slate-200 shadow-2xs flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Chỉ đường</span>
                </button>

                <button
                  onClick={() => onOpenCreateAppointment(selectedPlace.id)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors"
                >
                  Hẹn hội bạn ngay
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
