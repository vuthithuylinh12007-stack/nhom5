import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User, HangoutPlace, Appointment, GameRoom } from '../types';

interface AppContextType {
  currentUser: User;
  allUsers: User[];
  friends: User[];
  friendRequests: any[];
  hangoutPlaces: HangoutPlace[];
  appointments: Appointment[];
  activeRooms: GameRoom[];
  wsConnected: boolean;
  googleMapsApiKey: string;
  setGoogleMapsApiKey: (key: string) => void;
  isSharingLocation: boolean;
  userCoords: { lat: number; lng: number } | null;
  toggleLocationSharing: () => Promise<boolean>;
  sendWsMessage: (type: string, payload: any) => void;
  registerWsHandler: (handler: (type: string, payload: any) => void) => () => void;
  setCurrentUser: (user: User) => void;
  switchUserById: (id: string) => void;
  sendFriendRequest: (toId: string) => Promise<boolean>;
  respondFriendRequest: (requestId: string, accept: boolean) => Promise<void>;
  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'creatorId' | 'creatorName'>) => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  openConfigModal: boolean;
  setOpenConfigModal: (open: boolean) => void;
}

const defaultUser: User = {
  id: 'u1',
  name: 'Linh Đan',
  email: 'linhdan@bestie.vn',
  avatar: '/src/assets/images/avatar_linh_dan_1791969350529.jpg',
  statusText: 'Hôm nay đi trà sữa không cả nhà? 🧋',
  isOnline: true,
  location: { lat: 21.0285, lng: 105.8542, lastUpdated: Date.now(), isSharing: true }
};

const defaultAppointments: Appointment[] = [
  {
    id: 'apt_1',
    title: 'Trà Chiều Tâm Sự Tuần Này',
    placeId: 'p2',
    placeName: 'Phê La - Ô Chợ Dừa',
    placeAddress: '68 Ô Chợ Dừa, Đống Đa, Hà Nội',
    time: 'Thứ 7, 16:30',
    creatorId: 'u1',
    creatorName: 'Linh Đan',
    attendeeIds: ['u1', 'u2', 'u3'],
    notes: 'Thử món ô long sữa mới ra mắt!',
    createdAt: Date.now() - 86400000
  },
  {
    id: 'apt_2',
    title: 'Party Pizza Chúc Mừng Thi Xong 🎉',
    placeId: 'p3',
    placeName: 'Pizza 4P’s - Tràng Tiền',
    placeAddress: '43 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    time: 'Chủ Nhật, 18:00',
    creatorId: 'u2',
    creatorName: 'Minh Khởi',
    attendeeIds: ['u1', 'u2', 'u3', 'u4'],
    notes: 'Đã đặt bàn 4 người view lầu 2.',
    createdAt: Date.now() - 43200000
  }
];

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('mybestie_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return defaultUser;
  });

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
  const [hangoutPlaces, setHangoutPlaces] = useState<HangoutPlace[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    const saved = localStorage.getItem('mybestie_apts');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return defaultAppointments;
  });
  const [activeRooms, setActiveRooms] = useState<GameRoom[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const [googleMapsApiKey, setGoogleMapsApiKeyState] = useState<string>(() => {
    return localStorage.getItem('mybestie_gmap_key') || (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) || '';
  });
  const [isSharingLocation, setIsSharingLocation] = useState(currentUser.location?.isSharing || false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(
    currentUser.location ? { lat: currentUser.location.lat, lng: currentUser.location.lng } : null
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [openConfigModal, setOpenConfigModal] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const wsHandlersRef = useRef<Set<(type: string, payload: any) => void>>(new Set());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4000);
  }, []);

  const setGoogleMapsApiKey = (key: string) => {
    setGoogleMapsApiKeyState(key);
    localStorage.setItem('mybestie_gmap_key', key);
    showToast('Đã lưu cấu hình Google Maps API Key!');
  };

  // Save current user to local storage
  useEffect(() => {
    localStorage.setItem('mybestie_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Save appointments to local storage
  useEffect(() => {
    localStorage.setItem('mybestie_apts', JSON.stringify(appointments));
  }, [appointments]);

  // Fetch initial data from server
  const refreshData = useCallback(async () => {
    try {
      const [usersRes, friendsRes, placesRes, roomsRes] = await Promise.all([
        fetch('/api/users'),
        fetch(`/api/friends/${currentUser.id}`),
        fetch('/api/places'),
        fetch('/api/rooms')
      ]);

      if (usersRes.ok) {
        const uList = await usersRes.json();
        setAllUsers(uList);
      }
      if (friendsRes.ok) {
        const fData = await friendsRes.json();
        setFriends(fData.friends || []);
        setFriendRequests(fData.friendRequests || []);
      }
      if (placesRes.ok) {
        const pList = await placesRes.json();
        setHangoutPlaces(pList);
      }
      if (roomsRes.ok) {
        const rList = await roomsRes.json();
        setActiveRooms(rList);
      }
    } catch (err) {
      console.warn('API fetch warning, using fallback local mock:', err);
    }
  }, [currentUser.id]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Establish WebSocket Connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let reconnectTimer: NodeJS.Timeout;

    const connectWebSocket = () => {
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          // Announce user
          ws.send(JSON.stringify({
            type: 'user:connect',
            payload: { user: currentUser }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            // Handle global events
            if (type === 'presence:update') {
              setAllUsers(prev => prev.map(u => u.id === payload.userId ? { ...u, isOnline: payload.isOnline } : u));
              setFriends(prev => prev.map(u => u.id === payload.userId ? { ...u, isOnline: payload.isOnline } : u));
            } else if (type === 'location:updated') {
              setFriends(prev => prev.map(u => u.id === payload.userId ? { ...u, location: payload.location } : u));
            }

            // Dispatch to registered components
            wsHandlersRef.current.forEach(handler => handler(type, payload));
          } catch (e) {
            console.error('Failed to parse WS message:', e);
          }
        };

        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimer = setTimeout(connectWebSocket, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn('WS Connect Error:', err);
        reconnectTimer = setTimeout(connectWebSocket, 4000);
      }
    };

    connectWebSocket();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentUser]);

  const sendWsMessage = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const registerWsHandler = useCallback((handler: (type: string, payload: any) => void) => {
    wsHandlersRef.current.add(handler);
    return () => {
      wsHandlersRef.current.delete(handler);
    };
  }, []);

  // Location sharing toggle
  const toggleLocationSharing = async (): Promise<boolean> => {
    if (isSharingLocation) {
      setIsSharingLocation(false);
      const updatedUser = {
        ...currentUser,
        location: currentUser.location ? { ...currentUser.location, isSharing: false } : undefined
      };
      setCurrentUser(updatedUser);
      sendWsMessage('location:update', { lat: userCoords?.lat || 21.0285, lng: userCoords?.lng || 105.8542, isSharing: false });
      showToast('Đã dừng chia sẻ vị trí với bạn bè.');
      return false;
    }

    if (!navigator.geolocation) {
      showToast('Trình duyệt của bạn không hỗ trợ định vị.');
      return false;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserCoords(coords);
          setIsSharingLocation(true);
          const updatedUser = {
            ...currentUser,
            location: { lat: coords.lat, lng: coords.lng, lastUpdated: Date.now(), isSharing: true }
          };
          setCurrentUser(updatedUser);
          sendWsMessage('location:update', { lat: coords.lat, lng: coords.lng, isSharing: true });
          showToast('Đã bật chia sẻ vị trí thành công! 📍');
          resolve(true);
        },
        (err) => {
          console.warn('Geolocation permission denied or error:', err);
          // Fallback to default Hanoi coordinates if permission denied for preview
          const coords = { lat: 21.0285, lng: 105.8542 };
          setUserCoords(coords);
          setIsSharingLocation(true);
          const updatedUser = {
            ...currentUser,
            location: { lat: coords.lat, lng: coords.lng, lastUpdated: Date.now(), isSharing: true }
          };
          setCurrentUser(updatedUser);
          sendWsMessage('location:update', { lat: coords.lat, lng: coords.lng, isSharing: true });
          showToast('Đã kích hoạt vị trí giả lập tại Hoàn Kiếm, Hà Nội 📍');
          resolve(true);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const switchUserById = (id: string) => {
    const target = allUsers.find(u => u.id === id);
    if (target) {
      setCurrentUser(target);
      showToast(`Đã chuyển sang tài khoản: ${target.name}`);
    }
  };

  const sendFriendRequest = async (toId: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromId: currentUser.id, toId })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Đã gửi lời mời kết bạn! ✨');
        refreshData();
        return true;
      } else {
        showToast(data.message || 'Không thể gửi lời mời.');
        return false;
      }
    } catch (e) {
      showToast('Đã gửi lời mời kết bạn (mô phỏng)!');
      return true;
    }
  };

  const respondFriendRequest = async (requestId: string, accept: boolean) => {
    try {
      await fetch('/api/friends/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, accept })
      });
      showToast(accept ? 'Đã đồng ý kết bạn! Giờ cả hai là Bestie 🥳' : 'Đã từ chối lời mời.');
      refreshData();
    } catch (e) {
      refreshData();
    }
  };

  const createAppointment = (data: Omit<Appointment, 'id' | 'createdAt' | 'creatorId' | 'creatorName'>) => {
    const newApt: Appointment = {
      ...data,
      id: `apt_${Date.now()}`,
      creatorId: currentUser.id,
      creatorName: currentUser.name,
      createdAt: Date.now()
    };
    setAppointments(prev => [newApt, ...prev]);
    showToast('Đã lên lịch hẹn thành công! 📅');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        allUsers,
        friends,
        friendRequests,
        hangoutPlaces,
        appointments,
        activeRooms,
        wsConnected,
        googleMapsApiKey,
        setGoogleMapsApiKey,
        isSharingLocation,
        userCoords,
        toggleLocationSharing,
        sendWsMessage,
        registerWsHandler,
        setCurrentUser,
        switchUserById,
        sendFriendRequest,
        respondFriendRequest,
        createAppointment,
        toastMessage,
        showToast,
        openConfigModal,
        setOpenConfigModal
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
