import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

// In-memory data structures
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  statusText: string;
  isOnline: boolean;
  location?: { lat: number; lng: number; lastUpdated: number; isSharing: boolean };
}

interface FriendRequest {
  id: string;
  fromId: string;
  toId: string;
  timestamp: number;
}

interface GameRoom {
  id: string;
  code: string;
  name: string;
  gameType: 'rps' | 'caro' | 'quiz' | 'draw' | 'video';
  hostId: string;
  players: { id: string; name: string; avatar: string; score: number; ready: boolean }[];
  maxPlayers: number;
  status: 'waiting' | 'playing' | 'ended';
  gameState: any;
  createdAt: number;
}

// Initial mock users
const users: Map<string, User> = new Map([
  [
    'u1',
    {
      id: 'u1',
      name: 'Linh Đan',
      email: 'linhdan@bestie.vn',
      avatar: '/src/assets/images/avatar_linh_dan_1791969350529.jpg',
      statusText: 'Hôm nay đi trà sữa không cả nhà? 🧋',
      isOnline: true,
      location: { lat: 21.0285, lng: 105.8542, lastUpdated: Date.now(), isSharing: true } // Hoàn Kiếm, HN
    }
  ],
  [
    'u2',
    {
      id: 'u2',
      name: 'Minh Khởi',
      email: 'minhkhoi@bestie.vn',
      avatar: '/src/assets/images/avatar_minh_khoi_1791969350797.jpg',
      statusText: 'Đang cày đồ án, ai rủ game thì qua liền! 🎮',
      isOnline: true,
      location: { lat: 21.0031, lng: 105.8431, lastUpdated: Date.now(), isSharing: true } // Bách Khoa, HN
    }
  ],
  [
    'u3',
    {
      id: 'u3',
      name: 'Ngọc Ánh',
      email: 'ngocanh@bestie.vn',
      avatar: '/src/assets/images/avatar_ngoc_anh_1791969350770.jpg',
      statusText: 'Mood hôm nay: Cần một ly matcha latte ấm 🍵',
      isOnline: true,
      location: { lat: 21.0338, lng: 105.8148, lastUpdated: Date.now(), isSharing: true } // Cầu Giấy, HN
    }
  ],
  [
    'u4',
    {
      id: 'u4',
      name: 'Bảo Long',
      email: 'baolong@bestie.vn',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=BaoLong',
      statusText: 'Ai solo cờ caro không nàoo? 🔥',
      isOnline: false,
      location: { lat: 21.0402, lng: 105.8341, lastUpdated: Date.now() - 3600000, isSharing: false }
    }
  ]
]);

// Friendship relations (symmetric)
const friendships: Set<string> = new Set(['u1:u2', 'u2:u1', 'u1:u3', 'u3:u1', 'u2:u3', 'u3:u2', 'u1:u4', 'u4:u1']);
const friendRequests: FriendRequest[] = [];
const gameRooms: Map<string, GameRoom> = new Map();

// Sample hangout places in Vietnam (Hà Nội & TP.HCM)
const placesDatabase = [
  {
    id: 'p1',
    name: 'Cộng Cà Phê - Nhà Thờ',
    category: 'cafe',
    categoryName: 'Quán cà phê',
    address: '27 Nhà Thờ, Hoàn Kiếm, Hà Nội',
    lat: 21.0288,
    lng: 105.8491,
    rating: 4.6,
    tags: ['Cà phê cốt dừa', 'View đẹp', 'Không gian cổ điển']
  },
  {
    id: 'p2',
    name: 'Phê La - Ô Chợ Dừa',
    category: 'cafe',
    categoryName: 'Trà ô long & Cà phê',
    address: '68 Ô Chợ Dừa, Đống Đa, Hà Nội',
    lat: 21.0195,
    lng: 105.8269,
    rating: 4.8,
    tags: ['Trà Ô Long sữa', 'Chill cùng bạn', 'Check-in']
  },
  {
    id: 'p3',
    name: 'Pizza 4P’s - Tràng Tiền',
    category: 'restaurant',
    categoryName: 'Nhà hàng tụ họp',
    address: '43 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    lat: 21.0253,
    lng: 105.8561,
    rating: 4.9,
    tags: ['Pizza nướng củi', 'Cheese tươi', 'Hẹn hò nhóm']
  },
  {
    id: 'p4',
    name: 'Tổ hợp Vui chơi Complex 01',
    category: 'entertainment',
    categoryName: 'Khu vui chơi / Workshop',
    address: '29 Ngách 31 Ngõ 167 Tây Sơn, Đống Đa, Hà Nội',
    lat: 21.0116,
    lng: 105.8239,
    rating: 4.7,
    tags: ['Hội chợ cuối tuần', 'Workshop vẽ', 'Góc sống ảo']
  },
  {
    id: 'p5',
    name: 'Đại học Quốc Gia Hà Nội',
    category: 'school',
    categoryName: 'Trường học / Ký túc xá',
    address: '144 Xuân Thủy, Cầu Giấy, Hà Nội',
    lat: 21.0371,
    lng: 105.7828,
    rating: 4.5,
    tags: ['Khuôn viên xanh', 'Thư viện', 'Khu sinh viên']
  },
  {
    id: 'p6',
    name: 'Hồ Hoàn Kiếm & Phố Đi Bộ',
    category: 'entertainment',
    categoryName: 'Địa điểm dạo mát',
    address: 'Đinh Tiên Hoàng, Hàng Trống, Hoàn Kiếm, Hà Nội',
    lat: 21.0298,
    lng: 105.8524,
    rating: 4.9,
    tags: ['Dạo phố cuối tuần', 'Kem Tràng Tiền', 'Hóng gió']
  }
];

// Initialize default sample game rooms
gameRooms.set('BESTIE-101', {
  id: 'BESTIE-101',
  code: 'BESTIE-101',
  name: 'Đấu trí Caro Cuối Tuần 🏆',
  gameType: 'caro',
  hostId: 'u2',
  players: [
    { id: 'u2', name: 'Minh Khởi', avatar: '/src/assets/images/avatar_minh_khoi_1791969350797.jpg', score: 2, ready: true }
  ],
  maxPlayers: 2,
  status: 'waiting',
  gameState: {
    board: Array(15).fill(null).map(() => Array(15).fill(null)),
    turn: 'X',
    playerX: 'u2',
    playerO: null,
    winner: null
  },
  createdAt: Date.now() - 300000
});

gameRooms.set('QUIZ-777', {
  id: 'QUIZ-777',
  code: 'QUIZ-777',
  name: 'Ai hiểu Bestie nhất? 🧠✨',
  gameType: 'quiz',
  hostId: 'u1',
  players: [
    { id: 'u1', name: 'Linh Đan', avatar: '/src/assets/images/avatar_linh_dan_1791969350529.jpg', score: 300, ready: true },
    { id: 'u3', name: 'Ngọc Ánh', avatar: '/src/assets/images/avatar_ngoc_anh_1791969350770.jpg', score: 250, ready: true }
  ],
  maxPlayers: 6,
  status: 'waiting',
  gameState: {
    currentQuestionIndex: 0,
    roundEndsAt: Date.now() + 15000,
    answersSubmitted: {}
  },
  createdAt: Date.now() - 120000
});

// REST API Endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now(), service: 'MyBestie Server' });
});

app.get('/api/config', (req, res) => {
  res.json({
    googleMapsApiKeyPresent: Boolean(process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY),
    nodeEnv: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/users', (req, res) => {
  res.json(Array.from(users.values()));
});

app.post('/api/auth/login', (req, res) => {
  const { email } = req.body;
  const user = Array.from(users.values()).find(u => u.email.toLowerCase() === (email || '').toLowerCase());
  if (user) {
    user.isOnline = true;
    res.json({ success: true, user });
  } else {
    res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này.' });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, avatar, statusText } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tên và email.' });
  }
  const existing = Array.from(users.values()).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email này đã được sử dụng.' });
  }
  const id = `u_${Date.now()}`;
  const newUser: User = {
    id,
    name,
    email,
    avatar: avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=' + encodeURIComponent(name),
    statusText: statusText || 'Vừa gia nhập đại gia đình MyBestie! ✨',
    isOnline: true,
    location: { lat: 21.0285, lng: 105.8542, lastUpdated: Date.now(), isSharing: false }
  };
  users.set(id, newUser);
  // Auto friend with sample friends for instant fun
  friendships.add(`${id}:u1`);
  friendships.add(`u1:${id}`);
  friendships.add(`${id}:u2`);
  friendships.add(`u2:${id}`);

  res.json({ success: true, user: newUser });
});

app.get('/api/friends/:userId', (req, res) => {
  const { userId } = req.params;
  const friendList: User[] = [];
  for (const [key, user] of users.entries()) {
    if (key !== userId && friendships.has(`${userId}:${key}`)) {
      friendList.push(user);
    }
  }
  const incoming = friendRequests.filter(r => r.toId === userId);
  res.json({ friends: friendList, friendRequests: incoming });
});

app.post('/api/friends/request', (req, res) => {
  const { fromId, toId } = req.body;
  if (!fromId || !toId || fromId === toId) {
    return res.status(400).json({ success: false, message: 'Yêu cầu không hợp lệ.' });
  }
  if (friendships.has(`${fromId}:${toId}`)) {
    return res.status(400).json({ success: false, message: 'Hai bạn đã là bạn bè rồi!' });
  }
  const existing = friendRequests.find(r => r.fromId === fromId && r.toId === toId);
  if (!existing) {
    friendRequests.push({ id: `fr_${Date.now()}`, fromId, toId, timestamp: Date.now() });
  }
  res.json({ success: true, message: 'Đã gửi lời mời kết bạn!' });
});

app.post('/api/friends/respond', (req, res) => {
  const { requestId, accept } = req.body;
  const idx = friendRequests.findIndex(r => r.id === requestId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy lời mời.' });
  }
  const reqItem = friendRequests[idx];
  friendRequests.splice(idx, 1);

  if (accept) {
    friendships.add(`${reqItem.fromId}:${reqItem.toId}`);
    friendships.add(`${reqItem.toId}:${reqItem.fromId}`);
  }
  res.json({ success: true, accepted: accept });
});

app.get('/api/places', (req, res) => {
  const { query, category } = req.query;
  let results = [...placesDatabase];
  if (category && category !== 'all') {
    results = results.filter(p => p.category === category);
  }
  if (query && typeof query === 'string') {
    const q = query.toLowerCase();
    results = results.filter(p => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q)));
  }
  res.json(results);
});

app.get('/api/rooms', (req, res) => {
  res.json(Array.from(gameRooms.values()));
});

// WebSocket Server for Multi-room Multiplayer & WebRTC Signaling
const wss = new WebSocketServer({ noServer: true });

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  roomId?: string;
  userName?: string;
  isAlive?: boolean;
}

const connectedClients: Map<string, ExtendedWebSocket> = new Map();

function broadcastToRoom(roomId: string, message: any, excludeUserId?: string) {
  const payload = JSON.stringify(message);
  for (const client of connectedClients.values()) {
    if (client.roomId === roomId && client.readyState === WebSocket.OPEN) {
      if (!excludeUserId || client.userId !== excludeUserId) {
        client.send(payload);
      }
    }
  }
}

function broadcastToAll(message: any) {
  const payload = JSON.stringify(message);
  for (const client of connectedClients.values()) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

server.on('upgrade', (request, socket, head) => {
  const { pathname } = new URL(request.url || '', `http://${request.headers.host}`);
  if (pathname === '/ws') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws: ExtendedWebSocket) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      const { type, payload } = msg;

      switch (type) {
        case 'user:connect': {
          const { user } = payload;
          if (user?.id) {
            ws.userId = user.id;
            ws.userName = user.name;
            connectedClients.set(user.id, ws);
            const existing = users.get(user.id);
            if (existing) {
              existing.isOnline = true;
            }
            broadcastToAll({
              type: 'presence:update',
              payload: { userId: user.id, isOnline: true }
            });
          }
          break;
        }

        case 'room:join': {
          const { roomId, user } = payload;
          ws.roomId = roomId;
          let room = gameRooms.get(roomId);
          if (!room) {
            room = {
              id: roomId,
              code: roomId,
              name: payload.roomName || `Phòng ${roomId}`,
              gameType: payload.gameType || 'rps',
              hostId: user.id,
              players: [],
              maxPlayers: payload.maxPlayers || 4,
              status: 'waiting',
              gameState: payload.initialGameState || {},
              createdAt: Date.now()
            };
            gameRooms.set(roomId, room);
          }

          const existingPlayer = room.players.find(p => p.id === user.id);
          if (!existingPlayer && room.players.length < room.maxPlayers) {
            room.players.push({
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              score: 0,
              ready: false
            });
          }

          broadcastToRoom(roomId, {
            type: 'room:state',
            payload: { room, joiner: user }
          });
          break;
        }

        case 'room:leave': {
          const { roomId, userId } = payload;
          const room = gameRooms.get(roomId);
          if (room) {
            room.players = room.players.filter(p => p.id !== userId);
            if (room.players.length === 0) {
              gameRooms.delete(roomId);
            } else if (room.hostId === userId) {
              room.hostId = room.players[0].id;
            }
            broadcastToRoom(roomId, {
              type: 'room:state',
              payload: { room, leaverId: userId }
            });
          }
          ws.roomId = undefined;
          break;
        }

        case 'game:action': {
          const { roomId, action, data: actionData } = payload;
          const room = gameRooms.get(roomId);
          if (!room) return;

          // Server-authoritative logic for multiplayer games
          if (room.gameType === 'rps') {
            if (action === 'submit_choice') {
              if (!room.gameState.choices) room.gameState.choices = {};
              room.gameState.choices[ws.userId!] = actionData.choice; // 'rock' | 'paper' | 'scissors'

              // Check if both players chose
              const playerIds = room.players.map(p => p.id);
              if (playerIds.length >= 2 && playerIds.every(id => room.gameState.choices[id])) {
                const [p1, p2] = playerIds;
                const c1 = room.gameState.choices[p1];
                const c2 = room.gameState.choices[p2];

                let roundWinner = 'draw';
                if (c1 !== c2) {
                  if (
                    (c1 === 'rock' && c2 === 'scissors') ||
                    (c1 === 'scissors' && c2 === 'paper') ||
                    (c1 === 'paper' && c2 === 'rock')
                  ) {
                    roundWinner = p1;
                    const winnerPlayer = room.players.find(p => p.id === p1);
                    if (winnerPlayer) winnerPlayer.score += 1;
                  } else {
                    roundWinner = p2;
                    const winnerPlayer = room.players.find(p => p.id === p2);
                    if (winnerPlayer) winnerPlayer.score += 1;
                  }
                }
                room.gameState.roundResult = { winner: roundWinner, c1, c2, p1, p2 };
              }
            } else if (action === 'next_round') {
              room.gameState.choices = {};
              room.gameState.roundResult = null;
            } else if (action === 'reset_game') {
              room.gameState.choices = {};
              room.gameState.roundResult = null;
              room.players.forEach(p => (p.score = 0));
            }
          } else if (room.gameType === 'caro') {
            if (action === 'place_stone') {
              const { row, col, playerSign } = actionData;
              if (room.gameState.board && !room.gameState.board[row][col] && !room.gameState.winner) {
                room.gameState.board[row][col] = playerSign;
                // Switch turn
                room.gameState.turn = playerSign === 'X' ? 'O' : 'X';

                // Check 5 in a row
                const checkWin = (r: number, c: number, sign: string) => {
                  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]];
                  for (const [dr, dc] of dirs) {
                    let count = 1;
                    for (let step = 1; step < 5; step++) {
                      const nr = r + dr * step;
                      const nc = c + dc * step;
                      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && room.gameState.board[nr][nc] === sign) {
                        count++;
                      } else break;
                    }
                    for (let step = 1; step < 5; step++) {
                      const nr = r - dr * step;
                      const nc = c - dc * step;
                      if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && room.gameState.board[nr][nc] === sign) {
                        count++;
                      } else break;
                    }
                    if (count >= 5) return true;
                  }
                  return false;
                };

                if (checkWin(row, col, playerSign)) {
                  room.gameState.winner = playerSign;
                  const winningPlayer = room.players.find((p, idx) => (idx === 0 && playerSign === 'X') || (idx === 1 && playerSign === 'O'));
                  if (winningPlayer) winningPlayer.score += 1;
                }
              }
            } else if (action === 'rematch') {
              room.gameState.board = Array(15).fill(null).map(() => Array(15).fill(null));
              room.gameState.turn = 'X';
              room.gameState.winner = null;
            }
          } else if (room.gameType === 'quiz') {
            if (action === 'submit_quiz_answer') {
              const { questionIndex, answerIndex, isCorrect, timeBonus } = actionData;
              if (!room.gameState.answersSubmitted) room.gameState.answersSubmitted = {};
              room.gameState.answersSubmitted[ws.userId!] = { questionIndex, answerIndex, isCorrect };

              if (isCorrect) {
                const player = room.players.find(p => p.id === ws.userId);
                if (player) {
                  player.score += 100 + (timeBonus || 0);
                }
              }
            } else if (action === 'next_quiz_question') {
              room.gameState.currentQuestionIndex = (room.gameState.currentQuestionIndex || 0) + 1;
              room.gameState.answersSubmitted = {};
            }
          } else if (room.gameType === 'draw') {
            // Draw stroke sync or word guess
            if (action === 'draw_stroke') {
              broadcastToRoom(roomId, {
                type: 'draw:stroke',
                payload: actionData
              }, ws.userId);
              return;
            } else if (action === 'clear_canvas') {
              broadcastToRoom(roomId, {
                type: 'draw:clear'
              });
              return;
            } else if (action === 'guess_word') {
              const { guess, correctWord } = actionData;
              const isMatch = guess.trim().toLowerCase() === correctWord.trim().toLowerCase();
              if (isMatch) {
                const player = room.players.find(p => p.id === ws.userId);
                if (player) player.score += 50;
              }
              broadcastToRoom(roomId, {
                type: 'draw:guess_result',
                payload: {
                  userId: ws.userId,
                  userName: ws.userName,
                  guess,
                  isMatch
                }
              });
              return;
            }
          }

          broadcastToRoom(roomId, {
            type: 'room:state',
            payload: { room }
          });
          break;
        }

        // WebRTC Signaling for Video Calls
        case 'webrtc:signal': {
          const { roomId, targetUserId, signal } = payload;
          const targetWs = connectedClients.get(targetUserId);
          if (targetWs && targetWs.readyState === WebSocket.OPEN) {
            targetWs.send(JSON.stringify({
              type: 'webrtc:signal',
              payload: {
                senderId: ws.userId,
                senderName: ws.userName,
                signal
              }
            }));
          } else {
            // Broadcast to all other peers in room if no specific target
            broadcastToRoom(roomId, {
              type: 'webrtc:signal',
              payload: {
                senderId: ws.userId,
                senderName: ws.userName,
                signal
              }
            }, ws.userId);
          }
          break;
        }

        // Realtime location sharing update
        case 'location:update': {
          const { lat, lng, isSharing } = payload;
          if (ws.userId) {
            const user = users.get(ws.userId);
            if (user) {
              user.location = { lat, lng, lastUpdated: Date.now(), isSharing };
              broadcastToAll({
                type: 'location:updated',
                payload: { userId: ws.userId, location: user.location }
              });
            }
          }
          break;
        }

        // Chat in room
        case 'chat:send': {
          const { roomId, text } = payload;
          broadcastToRoom(roomId, {
            type: 'chat:message',
            payload: {
              id: `msg_${Date.now()}`,
              userId: ws.userId,
              userName: ws.userName,
              text,
              timestamp: Date.now()
            }
          });
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('Error handling WebSocket message:', err);
    }
  });

  ws.on('close', () => {
    if (ws.userId) {
      connectedClients.delete(ws.userId);
      const user = users.get(ws.userId);
      if (user) user.isOnline = false;

      broadcastToAll({
        type: 'presence:update',
        payload: { userId: ws.userId, isOnline: false }
      });

      if (ws.roomId) {
        const room = gameRooms.get(ws.roomId);
        if (room) {
          room.players = room.players.filter(p => p.id !== ws.userId);
          if (room.players.length === 0) {
            gameRooms.delete(ws.roomId);
          } else {
            broadcastToRoom(ws.roomId, {
              type: 'room:state',
              payload: { room, leaverId: ws.userId }
            });
          }
        }
      }
    }
  });
});

// Periodic ping to keep alive
setInterval(() => {
  for (const client of connectedClients.values()) {
    if (client.isAlive === false) {
      client.terminate();
    } else {
      client.isAlive = false;
      client.ping();
    }
  }
}, 30000);

// Setup Vite or static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`MyBestie server listening on http://0.0.0.0:${port}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
