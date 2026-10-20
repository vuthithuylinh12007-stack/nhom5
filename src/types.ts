export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  statusText: string;
  isOnline: boolean;
  location?: {
    lat: number;
    lng: number;
    lastUpdated: number;
    isSharing: boolean;
  };
}

export interface HangoutPlace {
  id: string;
  name: string;
  category: 'cafe' | 'restaurant' | 'school' | 'entertainment';
  categoryName: string;
  address: string;
  lat: number;
  lng: number;
  rating: number;
  tags: string[];
}

export interface Appointment {
  id: string;
  title: string;
  placeId: string;
  placeName: string;
  placeAddress: string;
  time: string;
  creatorId: string;
  creatorName: string;
  attendeeIds: string[];
  notes?: string;
  createdAt: number;
}

export type GameType = 'rps' | 'caro' | 'quiz' | 'draw' | 'video';

export interface GameRoom {
  id: string;
  code: string;
  name: string;
  gameType: GameType;
  hostId: string;
  players: {
    id: string;
    name: string;
    avatar: string;
    score: number;
    ready: boolean;
  }[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  gameState: any;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
}
