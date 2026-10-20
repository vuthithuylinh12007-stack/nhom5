import React, { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  PhoneCall,
  Users,
  MonitorUp,
  Settings,
  Sparkles,
  Info,
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const VideoCallView: React.FC = () => {
  const { currentUser, friends, sendWsMessage, registerWsHandler, showToast, setOpenConfigModal } = useApp();

  // Call status: 'idle' | 'prejoin' | 'calling'
  const [callState, setCallState] = useState<'idle' | 'prejoin' | 'calling'>('prejoin');
  const [callType, setCallType] = useState<'personal' | 'group'>('group');
  const [selectedFriendId, setSelectedFriendId] = useState(friends[0]?.id || 'u2');
  const [callRoomId, setCallRoomId] = useState('BESTIE-CALL-ROOM');

  // Media state
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // Video Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize Local Media Stream on Pre-join
  useEffect(() => {
    let active = true;

    async function initMedia() {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          showToast('Trình duyệt chưa hỗ trợ camera/micro trực tiếp.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup real audio volume meter with AudioContext
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          const audioCtx = new AudioCtx();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateVolume = () => {
            if (!active) return;
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateVolume);
          };
          updateVolume();
        } catch (e) {
          console.warn('AudioContext volume meter not supported:', e);
        }
      } catch (err) {
        console.warn('Could not access media devices:', err);
        showToast('Chưa cấp quyền camera/micro hoặc không tìm thấy thiết bị.');
        setIsCameraOn(false);
        setIsMicOn(false);
      }
    }

    initMedia();

    return () => {
      active = false;
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showToast]);

  // Toggle Camera
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
        showToast(videoTrack.enabled ? 'Đã bật camera' : 'Đã tắt camera');
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        showToast(audioTrack.enabled ? 'Đã bật micro' : 'Đã tắt micro');
      }
    }
  };

  // WebRTC Connection Setup
  const startCall = async () => {
    setCallState('calling');
    showToast('Đang kết nối vào phòng gọi WebRTC...');

    // RTCPeerConnection with Google STUN
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    // Attach local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote track
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendWsMessage('webrtc:signal', {
          roomId: callRoomId,
          targetUserId: callType === 'personal' ? selectedFriendId : undefined,
          signal: { type: 'candidate', candidate: event.candidate }
        });
      }
    };

    // Create Offer
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendWsMessage('webrtc:signal', {
        roomId: callRoomId,
        targetUserId: callType === 'personal' ? selectedFriendId : undefined,
        signal: { type: 'offer', sdp: offer.sdp }
      });
    } catch (e) {
      console.warn('Error creating WebRTC offer:', e);
    }
  };

  // Handle incoming signaling
  useEffect(() => {
    const unregister = registerWsHandler(async (type, payload) => {
      if (type === 'webrtc:signal') {
        const { signal, senderId } = payload;
        const pc = peerConnectionRef.current;
        if (!pc) return;

        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendWsMessage('webrtc:signal', {
            roomId: callRoomId,
            targetUserId: senderId,
            signal: { type: 'answer', sdp: answer.sdp }
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        } else if (signal.type === 'candidate' && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.warn('Error adding ICE candidate:', e);
          }
        }
      }
    });

    return unregister;
  }, [registerWsHandler, callRoomId, sendWsMessage]);

  // Screen Share Toggle
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (!navigator.mediaDevices.getDisplayMedia) {
          showToast('Trình duyệt không hỗ trợ chia sẻ màn hình.');
          return;
        }
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const screenTrack = screenStream.getVideoTracks()[0];

        if (peerConnectionRef.current) {
          const senders = peerConnectionRef.current.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === 'video');
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
        showToast('Bắt đầu chia sẻ màn hình!');
      } catch (e) {
        showToast('Đã hủy chia sẻ màn hình.');
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (peerConnectionRef.current && videoTrack) {
        const senders = peerConnectionRef.current.getSenders();
        const videoSender = senders.find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(videoTrack);
        }
      }
    }
    setIsScreenSharing(false);
    showToast('Đã dừng chia sẻ màn hình.');
  };

  // End Call
  const endCall = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (isScreenSharing) stopScreenShare();
    setCallState('prejoin');
    showToast('Đã kết thúc cuộc gọi.');
  };

  const targetFriend = friends.find((f) => f.id === selectedFriendId) || friends[0];

  return (
    <div className="space-y-6 pb-16">
      {/* Notice & STUN Configuration Helper */}
      <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-purple-900">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            Hệ thống truyền tải âm thanh & hình ảnh qua giao thức <strong>WebRTC P2P</strong> với máy chủ báo hiệu WebSocket.
          </span>
        </div>
        <button
          onClick={() => setOpenConfigModal(true)}
          className="text-purple-700 hover:text-purple-900 font-bold hover:underline flex items-center gap-1 shrink-0"
        >
          <span>Xem cấu hình STUN / TURN</span>
          <Settings className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* VIEW 1: PRE-JOIN SCREEN (Phòng chờ kiểm tra thiết bị) */}
      {callState === 'prejoin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Camera Preview */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-4 border border-purple-200 shadow-xl overflow-hidden relative flex flex-col items-center justify-center min-h-[380px]">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-[340px] object-cover rounded-2xl transform scale-x-[-1] transition-opacity ${
                isCameraOn ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {!isCameraOn && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70 space-y-2">
                <VideoOff className="w-12 h-12 text-slate-500" />
                <p className="text-xs">Camera đang tắt</p>
              </div>
            )}

            {/* Audio volume live meter bar */}
            <div className="absolute bottom-6 left-6 right-6 z-10 flex items-center justify-between bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs text-white">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span>Âm lượng micro:</span>
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500 transition-all duration-75"
                    style={{ width: `${isMicOn ? micVolume : 0}%` }}
                  />
                </div>
              </div>

              {/* Media Toggles */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMic}
                  className={`p-2 rounded-lg transition-colors ${
                    isMicOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-rose-500 text-white'
                  }`}
                  title={isMicOn ? 'Tắt micro' : 'Bật micro'}
                >
                  {isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleCamera}
                  className={`p-2 rounded-lg transition-colors ${
                    isCameraOn ? 'bg-white/20 text-white hover:bg-white/30' : 'bg-rose-500 text-white'
                  }`}
                  title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
                >
                  {isCameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Join Controls & Room Selection */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-purple-100 shadow-xs space-y-5">
            <div>
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                Phòng chờ kiểm tra thiết bị
              </span>
              <h2 className="text-2xl font-bold text-slate-800 mt-0.5">Sẵn sàng kết nối!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Kiểm tra hình ảnh và giọng nói trước khi tham gia cuộc gọi cùng hội bạn thân.
              </p>
            </div>

            {/* Call type switch */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Loại cuộc gọi:</label>
              <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                <button
                  onClick={() => setCallType('group')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    callType === 'group'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Gọi nhóm Bestie</span>
                </button>
                <button
                  onClick={() => setCallType('personal')}
                  className={`p-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${
                    callType === 'personal'
                      ? 'border-purple-600 bg-purple-50 text-purple-900'
                      : 'border-slate-200 text-slate-600 hover:border-purple-300'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span>Gọi riêng 1-1</span>
                </button>
              </div>
            </div>

            {callType === 'personal' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Chọn bạn thân để gọi:
                </label>
                <select
                  value={selectedFriendId}
                  onChange={(e) => setSelectedFriendId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400 bg-white"
                >
                  {friends.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.isOnline ? 'Đang online' : 'Ngoại tuyến'})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700">Tên phòng gọi:</label>
                <input
                  type="text"
                  value={callRoomId}
                  onChange={(e) => setCallRoomId(e.target.value)}
                  placeholder="BESTIE-ROOM-01"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400"
                />
              </div>
            )}

            <button
              onClick={startCall}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Tham gia cuộc gọi ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* VIEW 2: IN-CALL SCREEN (Màn hình trong cuộc gọi trực tiếp) */}
      {callState === 'calling' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Local Video Card */}
            <div className="relative bg-slate-950 rounded-3xl overflow-hidden aspect-video border-2 border-purple-300 shadow-xl flex items-center justify-center">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Bạn ({currentUser.name})</span>
              </div>
            </div>

            {/* Remote Friend Video Card */}
            <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-video border border-purple-200 shadow-xl flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />

              {/* Placeholder when waiting for remote peer */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/80 space-y-3 bg-gradient-to-t from-slate-950 via-slate-900 to-slate-900">
                <img
                  src={targetFriend?.avatar || '/src/assets/images/avatar_minh_khoi_1791969350797.jpg'}
                  alt="Bestie Avatar"
                  referrerPolicy="no-referrer"
                  className="w-20 h-20 rounded-full object-cover border-4 border-purple-400 shadow-xl animate-pulse"
                />
                <div>
                  <h3 className="font-bold text-lg text-white">
                    {callType === 'personal' ? targetFriend?.name : 'Phòng Nhóm MyBestie'}
                  </h3>
                  <p className="text-xs text-purple-300 mt-1">
                    Đang gửi tín hiệu gọi qua WebSocket... Hãy bảo bạn mở tab để tham gia!
                  </p>
                </div>
              </div>

              <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-black/60 backdrop-blur-md rounded-full text-xs font-bold text-white flex items-center gap-1.5 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
                <span>
                  {callType === 'personal' ? targetFriend?.name : 'Phòng Gọi Hội Bạn'}
                </span>
              </div>
            </div>
          </div>

          {/* Floating Control Bar */}
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-lg flex items-center justify-center gap-4 max-w-md mx-auto">
            <button
              onClick={toggleMic}
              className={`p-3 rounded-2xl transition-all ${
                isMicOn
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-rose-500 text-white shadow-xs'
              }`}
              title={isMicOn ? 'Tắt micro' : 'Bật micro'}
            >
              {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleCamera}
              className={`p-3 rounded-2xl transition-all ${
                isCameraOn
                  ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  : 'bg-rose-500 text-white shadow-xs'
              }`}
              title={isCameraOn ? 'Tắt camera' : 'Bật camera'}
            >
              {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-2xl transition-all ${
                isScreenSharing
                  ? 'bg-emerald-500 text-white'
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ màn hình'}
            >
              <MonitorUp className="w-5 h-5" />
            </button>

            <button
              onClick={endCall}
              className="px-5 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95"
            >
              <PhoneOff className="w-5 h-5" />
              <span>Kết thúc</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
