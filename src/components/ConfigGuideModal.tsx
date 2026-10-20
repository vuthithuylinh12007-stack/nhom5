import React, { useState } from 'react';
import { X, MapPin, Database, Video, CheckCircle2, Copy, ExternalLink, Key } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface ConfigGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigGuideModal: React.FC<ConfigGuideModalProps> = ({ isOpen, onClose }) => {
  const { googleMapsApiKey, setGoogleMapsApiKey, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'maps' | 'firebase' | 'webrtc'>('maps');
  const [inputKey, setInputKey] = useState(googleMapsApiKey);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    showToast('Đã sao chép vào bộ nhớ tạm!');
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setGoogleMapsApiKey(inputKey.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-pink-50">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cấu hình & Tích hợp Dịch vụ</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hướng dẫn chi tiết từng bước đưa MyBestie vào hoạt động thực tế
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('maps')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'maps'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-purple-600'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Google Maps API</span>
          </button>
          <button
            onClick={() => setActiveTab('firebase')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'firebase'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-purple-600'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Firebase & Backend</span>
          </button>
          <button
            onClick={() => setActiveTab('webrtc')}
            className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'webrtc'
                ? 'border-purple-600 text-purple-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-purple-600'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>WebRTC Video Call</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {activeTab === 'maps' && (
            <div className="space-y-4">
              <div className="p-4 bg-purple-50/70 rounded-xl border border-purple-200/60">
                <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                  <Key className="w-4 h-4 text-purple-600" />
                  Nhập Google Maps API Key trực tiếp
                </h3>
                <p className="text-xs text-purple-700 mt-1 mb-3">
                  Nếu bạn đã có API Key được kích hoạt Maps JavaScript API, hãy dán vào đây để trải nghiệm bản đồ vệ tinh và vector thực tế ngay lập tức:
                </p>
                <form onSubmit={handleSaveKey} className="flex gap-2">
                  <input
                    type="text"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="AIzaSy..."
                    className="flex-1 px-3 py-2 text-xs border border-purple-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition-colors shrink-0"
                  >
                    Lưu Key
                  </button>
                </form>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Các bước tạo Google Maps API Key miễn phí:</h4>
                <ol className="list-decimal pl-5 space-y-2 text-xs leading-relaxed text-slate-600">
                  <li>
                    Truy cập{' '}
                    <a
                      href="https://console.cloud.google.com/google/maps-apis"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Google Cloud Console <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    và đăng nhập tài khoản Google.
                  </li>
                  <li>Tạo một dự án mới (ví dụ: <code>MyBestie-App</code>).</li>
                  <li>
                    Vào <strong>APIs & Services &gt; Library</strong>, tìm và bấm <strong>Enable</strong> các API sau:
                    <ul className="list-disc pl-5 mt-1 font-mono text-purple-800">
                      <li>Maps JavaScript API</li>
                      <li>Places API (New)</li>
                      <li>Geocoding API</li>
                    </ul>
                  </li>
                  <li>
                    Vào <strong>Credentials &gt; Create Credentials &gt; API Key</strong>.
                  </li>
                  <li>
                    <strong>Bảo mật:</strong> Thêm giới hạn HTTP Referrer để chỉ cho phép tên miền ứng dụng của bạn gọi API.
                  </li>
                  <li>
                    Thêm biến môi trường vào file <code>.env</code>:
                    <div className="mt-2 relative">
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
                        VITE_GOOGLE_MAPS_API_KEY="AIzaSyYourActualKeyHere"
                      </pre>
                      <button
                        onClick={() => copyToClipboard('VITE_GOOGLE_MAPS_API_KEY="AIzaSyYourActualKeyHere"', 'mapenv')}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs flex items-center gap-1"
                      >
                        {copiedSnippet === 'mapenv' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'firebase' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200">
                <span className="font-semibold text-pink-900 block mb-1">Kiến trúc Backend hiện tại:</span>
                MyBestie đã tích hợp sẵn máy chủ Express full-stack với WebSocket server thời gian thực để đồng bộ trạng thái phòng chơi, cờ caro, oẳn tù tì, đố vui và báo hiệu WebRTC. Bạn có thể dễ dàng gắn thêm Firebase Firestore để lưu trữ vĩnh viễn dữ liệu người dùng.
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2">Các bước kết nối Firebase:</h4>
                <ol className="list-decimal pl-5 space-y-2">
                  <li>
                    Mở{' '}
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      Firebase Console <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    và nhấn <strong>Add project</strong>.
                  </li>
                  <li>
                    Bật <strong>Authentication</strong> (chọn phương thức Email/Password hoặc Google Sign-In).
                  </li>
                  <li>
                    Bật <strong>Cloud Firestore</strong> ở chế độ Production.
                  </li>
                  <li>
                    Tạo cấu hình Security Rules bảo vệ dữ liệu:
                    <div className="mt-2 relative">
                      <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /rooms/{roomId} {
      allow read, write: if request.auth != null;
    }
  }
}`}
                      </pre>
                      <button
                        onClick={() => copyToClipboard(`rules_version = '2';\nservice cloud.firestore {\n  match /databases/{database}/documents {\n    match /users/{userId} {\n      allow read: if request.auth != null;\n      allow write: if request.auth != null && request.auth.uid == userId;\n    }\n    match /rooms/{roomId} {\n      allow read, write: if request.auth != null;\n    }\n  }\n}`, 'fbrules')}
                        className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs flex items-center gap-1"
                      >
                        {copiedSnippet === 'fbrules' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {activeTab === 'webrtc' && (
            <div className="space-y-4 text-xs leading-relaxed text-slate-600">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-semibold text-purple-900 block mb-1">Cách thức hoạt động của WebRTC trong MyBestie:</span>
                Ứng dụng sử dụng chuẩn <code>RTCPeerConnection</code> trình duyệt với máy chủ WebSocket làm <em>Signaling Server</em> (trao đổi Offer/Answer/ICE Candidates). Video và âm thanh truyền trực tiếp Peer-to-Peer giữa hai thiết bị mà không lưu trữ qua server trung gian!
              </div>

              <div>
                <h4 className="font-bold text-slate-800 text-sm mb-2">Cấu hình STUN / TURN Server cho mạng Internet thực tế:</h4>
                <p className="mb-2">
                  MyBestie đã mặc định cấu hình Google Public STUN server (<code>stun:stun.l.google.com:19302</code>). Để cuộc gọi thông suốt khi người dùng ở sau tường lửa NAT đối xứng hoặc 4G, bạn nên bổ sung dịch vụ TURN (như Twilio Network Traversal hoặc Xirsys):
                </p>
                <div className="relative">
                  <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono overflow-x-auto">
{`const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  {
    urls: 'turn:your-turn-server.net:3478',
    username: 'bestie_user',
    credential: 'secure_password'
  }
];`}
                  </pre>
                  <button
                    onClick={() => copyToClipboard(`const iceServers = [\n  { urls: 'stun:stun.l.google.com:19302' },\n  {\n    urls: 'turn:your-turn-server.net:3478',\n    username: 'bestie_user',\n    credential: 'secure_password'\n  }\n];`, 'webrtcice')}
                    className="absolute top-2 right-2 p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-sm text-xs flex items-center gap-1"
                  >
                    {copiedSnippet === 'webrtcice' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
