import React, { useState, useEffect, useRef } from 'react';
import {
  Gamepad2,
  Users,
  Trophy,
  RotateCcw,
  Sparkles,
  Send,
  Eraser,
  Copy,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  HelpCircle,
  Clock,
  Play
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { GameType, GameRoom } from '../types';

interface GamesViewProps {
  initialRoomCode?: string;
  onOpenCreateRoom: () => void;
}

export const GamesView: React.FC<GamesViewProps> = ({ initialRoomCode, onOpenCreateRoom }) => {
  const { currentUser, sendWsMessage, registerWsHandler, showToast } = useApp();

  const [mode, setMode] = useState<'online' | 'local'>('online');
  const [selectedGameType, setSelectedGameType] = useState<GameType>('caro');

  // Online Room State
  const [roomCodeInput, setRoomCodeInput] = useState(initialRoomCode || '');
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [roomMessages, setRoomMessages] = useState<{ id: string; userName: string; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Local Pass & Play State
  // 1. Caro Local
  const [localCaroBoard, setLocalCaroBoard] = useState<(string | null)[][]>(() =>
    Array(15).fill(null).map(() => Array(15).fill(null))
  );
  const [localCaroTurn, setLocalCaroTurn] = useState<'X' | 'O'>('X');
  const [localCaroWinner, setLocalCaroWinner] = useState<string | null>(null);

  // 2. RPS Local
  const [localRpsP1, setLocalRpsP1] = useState<string | null>(null);
  const [localRpsP2, setLocalRpsP2] = useState<string | null>(null);
  const [localRpsResult, setLocalRpsResult] = useState<string | null>(null);
  const [localRpsScore, setLocalRpsScore] = useState({ p1: 0, p2: 0 });

  // 3. Quiz Questions Pool
  const quizQuestions = [
    {
      q: 'Món ăn vặt nào được coi là "quốc hồn quốc túy" khi hội bạn thân tụ tập?',
      options: ['Trà sữa trân châu full topping', 'Bánh tráng trộn', 'Chè khúc bạch', 'Khoai tây chiên'],
      correct: 0,
      explain: 'Trà sữa luôn là lý do số 1 để mở đầu mọi cuộc hẹn của hội bạn thân!'
    },
    {
      q: 'Khi một đứa bạn trong nhóm đột nhiên im lặng trong nhóm chat quá 2 ngày, điều đó có nghĩa là gì?',
      options: ['Nó giận ai đó', 'Bận cày deadline ngập đầu', 'Đang có người yêu mới', 'Cả 3 trường hợp trên'],
      correct: 3,
      explain: 'Hội bạn thân luôn hiểu rõ mọi lý do biến mất bí ẩn!'
    },
    {
      q: 'Kỷ lục đi trễ kinh điển của bạn thân khi nói "Tao đang trên đường tới nè":',
      options: ['Đang dắt xe ra cổng', 'Vừa mới ngủ dậy bật mắt', 'Còn đang chọn đồ', 'Cả 3 đáp án trên'],
      correct: 1,
      explain: 'Câu nói kinh điển: "Tao gần tới rồi" thực ra là vừa mở mắt ra!'
    },
    {
      q: 'Hồ Hoàn Kiếm (Hà Nội) còn có tên gọi lịch sử nổi tiếng nào?',
      options: ['Hồ Gươm', 'Hồ Tây', 'Hồ Trúc Bạch', 'Hồ Ba Mẫu'],
      correct: 0,
      explain: 'Hồ Hoàn Kiếm hay Hồ Gươm gắn liền với truyền thuyết trả gươm báu cho Rùa Vàng.'
    }
  ];

  const [localQuizIndex, setLocalQuizIndex] = useState(0);
  const [localQuizScore, setLocalQuizScore] = useState(0);
  const [localQuizSelected, setLocalQuizSelected] = useState<number | null>(null);

  // 4. Drawing Canvas for Pictionary
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#8b5cf6');
  const [brushSize, setBrushSize] = useState(3);
  const [currentWordToDraw] = useState('Trà sữa');
  const [guessInput, setGuessInput] = useState('');

  // Register WebSocket Room listener
  useEffect(() => {
    const unregister = registerWsHandler((type, payload) => {
      if (type === 'room:state') {
        const { room } = payload;
        setCurrentRoom(room);
        if (payload.joiner && payload.joiner.id !== currentUser.id) {
          showToast(`${payload.joiner.name} vừa tham gia phòng!`);
        }
      } else if (type === 'chat:message') {
        setRoomMessages((prev) => [...prev, payload]);
      } else if (type === 'draw:stroke') {
        // Draw remote stroke
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const { x0, y0, x1, y1, color, size } = payload;
            ctx.beginPath();
            ctx.moveTo(x0, y0);
            ctx.lineTo(x1, y1);
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = 'round';
            ctx.stroke();
          }
        }
      } else if (type === 'draw:clear') {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else if (type === 'draw:guess_result') {
        if (payload.isMatch) {
          showToast(`🎉 ${payload.userName} đã đoán đúng từ: "${payload.guess}"!`);
        }
      }
    });

    return unregister;
  }, [registerWsHandler, currentUser.id, showToast]);

  // Join online room
  const handleJoinOnlineRoom = (code: string) => {
    if (!code.trim()) {
      showToast('Vui lòng nhập mã phòng!');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    sendWsMessage('room:join', {
      roomId: cleanCode,
      roomName: `Phòng ${cleanCode}`,
      gameType: selectedGameType,
      user: currentUser,
      maxPlayers: 4
    });
    showToast(`Đang kết nối vào phòng ${cleanCode}...`);
  };

  // Leave online room
  const handleLeaveRoom = () => {
    if (currentRoom) {
      sendWsMessage('room:leave', { roomId: currentRoom.id, userId: currentUser.id });
      setCurrentRoom(null);
      setRoomMessages([]);
      showToast('Đã rời phòng chơi.');
    }
  };

  // Online Caro Move
  const handleOnlineCaroMove = (row: number, col: number) => {
    if (!currentRoom || currentRoom.gameState.winner) return;
    const isPlayer1 = currentRoom.players[0]?.id === currentUser.id;
    const isPlayer2 = currentRoom.players[1]?.id === currentUser.id;

    if (!isPlayer1 && !isPlayer2) {
      showToast('Bạn đang ở chế độ khán giả theo dõi trận đấu!');
      return;
    }

    const currentSign = currentRoom.gameState.turn || 'X';
    if ((isPlayer1 && currentSign !== 'X') || (isPlayer2 && currentSign !== 'O')) {
      showToast('Chưa đến lượt của bạn!');
      return;
    }

    sendWsMessage('game:action', {
      roomId: currentRoom.id,
      action: 'place_stone',
      data: { row, col, playerSign: currentSign }
    });
  };

  // Online RPS Choice
  const handleOnlineRpsChoice = (choice: 'rock' | 'paper' | 'scissors') => {
    if (!currentRoom) return;
    sendWsMessage('game:action', {
      roomId: currentRoom.id,
      action: 'submit_choice',
      data: { choice }
    });
    showToast(`Đã ra ${choice === 'rock' ? 'Búa ✊' : choice === 'paper' ? 'Bao ✋' : 'Kéo ✌️'}. Đang đợi bạn thân...`);
  };

  // Local Caro Check Win
  const checkLocalCaroWin = (board: (string | null)[][], r: number, c: number, sign: string) => {
    const dirs = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1]
    ];
    for (const [dr, dc] of dirs) {
      let count = 1;
      for (let step = 1; step < 5; step++) {
        const nr = r + dr * step;
        const nc = c + dc * step;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === sign) {
          count++;
        } else break;
      }
      for (let step = 1; step < 5; step++) {
        const nr = r - dr * step;
        const nc = c - dc * step;
        if (nr >= 0 && nr < 15 && nc >= 0 && nc < 15 && board[nr][nc] === sign) {
          count++;
        } else break;
      }
      if (count >= 5) return true;
    }
    return false;
  };

  const handleLocalCaroClick = (r: number, c: number) => {
    if (localCaroBoard[r][c] || localCaroWinner) return;
    const newBoard = localCaroBoard.map((row) => [...row]);
    newBoard[r][c] = localCaroTurn;
    setLocalCaroBoard(newBoard);

    if (checkLocalCaroWin(newBoard, r, c, localCaroTurn)) {
      setLocalCaroWinner(localCaroTurn);
      showToast(`🏆 Người chơi ${localCaroTurn} đã chiến thắng với chuỗi 5 quân liên tiếp!`);
    } else {
      setLocalCaroTurn(localCaroTurn === 'X' ? 'O' : 'X');
    }
  };

  const handleResetLocalCaro = () => {
    setLocalCaroBoard(Array(15).fill(null).map(() => Array(15).fill(null)));
    setLocalCaroTurn('X');
    setLocalCaroWinner(null);
  };

  // Local RPS Submit
  const handleLocalRpsSubmit = (p1Choice: string, p2Choice: string) => {
    setLocalRpsP1(p1Choice);
    setLocalRpsP2(p2Choice);

    if (p1Choice === p2Choice) {
      setLocalRpsResult('Hòa nhau rồi!');
    } else if (
      (p1Choice === 'rock' && p2Choice === 'scissors') ||
      (p1Choice === 'scissors' && p2Choice === 'paper') ||
      (p1Choice === 'paper' && p2Choice === 'rock')
    ) {
      setLocalRpsResult('Người chơi 1 (Xanh) thắng!');
      setLocalRpsScore((prev) => ({ ...prev, p1: prev.p1 + 1 }));
    } else {
      setLocalRpsResult('Người chơi 2 (Hồng) thắng!');
      setLocalRpsScore((prev) => ({ ...prev, p2: prev.p2 + 1 }));
    }
  };

  // Send in-room chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentRoom) return;
    sendWsMessage('chat:send', { roomId: currentRoom.id, text: chatInput.trim() });
    setChatInput('');
  };

  // Send draw stroke to websocket
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPos.current = { x, y };
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPos.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = drawColor;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.stroke();
    }

    if (currentRoom) {
      sendWsMessage('game:action', {
        roomId: currentRoom.id,
        action: 'draw_stroke',
        data: {
          x0: lastPos.current.x,
          y0: lastPos.current.y,
          x1: x,
          y1: y,
          color: drawColor,
          size: brushSize
        }
      });
    }

    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPos.current = null;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (currentRoom) {
      sendWsMessage('game:action', { roomId: currentRoom.id, action: 'clear_canvas', data: {} });
    }
  };

  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guessInput.trim()) return;
    if (currentRoom) {
      sendWsMessage('game:action', {
        roomId: currentRoom.id,
        action: 'guess_word',
        data: { guess: guessInput.trim(), correctWord: currentWordToDraw }
      });
    } else {
      if (guessInput.trim().toLowerCase() === currentWordToDraw.toLowerCase()) {
        showToast('🎉 Chính xác! Bạn đã đoán đúng từ khóa bí mật!');
      } else {
        showToast('Chưa chính xác, hãy thử lại nhé!');
      }
    }
    setGuessInput('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header & Mode Switcher */}
      <div className="bg-white rounded-3xl p-6 border border-purple-100 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center">
              <Gamepad2 className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Khu Trò Chơi Nhiều Người</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Đấu trí Caro, Oẳn tù tì, Đố vui bạn thân và Vẽ hình đoán chữ theo thời gian thực
          </p>
        </div>

        {/* Mode Segmented Controls */}
        <div className="flex items-center gap-1 p-1 bg-purple-50 rounded-2xl border border-purple-200 text-xs font-semibold">
          <button
            onClick={() => setMode('online')}
            className={`px-4 py-2 rounded-xl transition-all ${
              mode === 'online'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            🌐 Chơi Online Nhiều Người (WebSocket)
          </button>
          <button
            onClick={() => setMode('local')}
            className={`px-4 py-2 rounded-xl transition-all ${
              mode === 'local'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'text-purple-700 hover:text-purple-900'
            }`}
          >
            📱 Chơi Thử 1 Thiết Bị (Cục Bộ)
          </button>
        </div>
      </div>

      {/* Online Mode Room Connection Bar */}
      {mode === 'online' && !currentRoom && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-pink-200">
                Đồng bộ hóa thời gian thực
              </span>
              <h3 className="text-xl font-bold mt-0.5">Tham gia hoặc tạo phòng chơi riêng</h3>
              <p className="text-xs text-purple-100 mt-1">
                Nhập mã phòng từ bạn thân hoặc tạo phòng mới để bắt đầu trận đấu online.
              </p>
            </div>

            <button
              onClick={onOpenCreateRoom}
              className="px-5 py-2.5 bg-white text-purple-700 hover:bg-purple-50 font-bold text-xs rounded-xl shadow-md transition-all shrink-0 active:scale-95"
            >
              + Tạo phòng mới
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <div className="relative flex-1 w-full">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                placeholder="Nhập mã phòng (ví dụ: BESTIE-101 hoặc QUIZ-777)..."
                className="w-full px-4 py-2.5 rounded-xl bg-white/20 border border-white/30 text-white placeholder-purple-200 text-xs focus:outline-hidden focus:bg-white/30"
              />
            </div>
            <button
              onClick={() => handleJoinOnlineRoom(roomCodeInput)}
              className="w-full sm:w-auto px-6 py-2.5 bg-purple-900/80 hover:bg-purple-900 text-white font-bold text-xs rounded-xl border border-white/20 transition-all shrink-0"
            >
              Tham gia phòng
            </button>
          </div>

          {/* Quick Rooms Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-purple-200 text-[11px]">Phòng gợi ý có sẵn:</span>
            <button
              onClick={() => {
                setRoomCodeInput('BESTIE-101');
                setSelectedGameType('caro');
                handleJoinOnlineRoom('BESTIE-101');
              }}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-white text-[11px] font-mono border border-white/20 transition-colors"
            >
              BESTIE-101 (Cờ Caro Minh Khởi)
            </button>
            <button
              onClick={() => {
                setRoomCodeInput('QUIZ-777');
                setSelectedGameType('quiz');
                handleJoinOnlineRoom('QUIZ-777');
              }}
              className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg text-white text-[11px] font-mono border border-white/20 transition-colors"
            >
              QUIZ-777 (Đố Vui Bestie)
            </button>
          </div>
        </div>
      )}

      {/* Online Active Room Header if joined */}
      {mode === 'online' && currentRoom && (
        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-800">{currentRoom.name}</h3>
                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-md font-mono text-xs font-bold">
                  {currentRoom.code}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Chế độ: <span className="font-semibold text-purple-700 uppercase">{currentRoom.gameType}</span> · {currentRoom.players.length} người trong phòng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center -space-x-2">
              {currentRoom.players.map((p) => (
                <img
                  key={p.id}
                  src={p.avatar}
                  alt={p.name}
                  referrerPolicy="no-referrer"
                  title={`${p.name} (${p.score} điểm)`}
                  className="w-8 h-8 rounded-full border-2 border-white object-cover shadow-2xs"
                />
              ))}
            </div>

            <button
              onClick={handleLeaveRoom}
              className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-xl border border-rose-200 transition-colors"
            >
              Rời phòng
            </button>
          </div>
        </div>
      )}

      {/* Game Type Selection Tabs (when in local mode or switching) */}
      {(!currentRoom || mode === 'local') && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setSelectedGameType('caro')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedGameType === 'caro'
                ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
            }`}
          >
            <span className="text-2xl block mb-1">⭕❌</span>
            <span className="font-bold text-sm block">Cờ Caro</span>
            <span className="text-[11px] text-slate-500">5 quân thẳng hàng</span>
          </button>

          <button
            onClick={() => setSelectedGameType('rps')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedGameType === 'rps'
                ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
            }`}
          >
            <span className="text-2xl block mb-1">✌️✊✋</span>
            <span className="font-bold text-sm block">Oẳn Tù Tì</span>
            <span className="text-[11px] text-slate-500">Đọ tay may mắn</span>
          </button>

          <button
            onClick={() => setSelectedGameType('quiz')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedGameType === 'quiz'
                ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
            }`}
          >
            <span className="text-2xl block mb-1">🧠✨</span>
            <span className="font-bold text-sm block">Đố Vui Bestie</span>
            <span className="text-[11px] text-slate-500">Thử thách hội bạn</span>
          </button>

          <button
            onClick={() => setSelectedGameType('draw')}
            className={`p-4 rounded-2xl border text-left transition-all ${
              selectedGameType === 'draw'
                ? 'border-purple-600 bg-purple-50/70 text-purple-900 ring-2 ring-purple-200 shadow-xs'
                : 'border-slate-200 bg-white hover:border-purple-300 text-slate-700'
            }`}
          >
            <span className="text-2xl block mb-1">🎨🖌️</span>
            <span className="font-bold text-sm block">Đoán Từ & Hình</span>
            <span className="text-[11px] text-slate-500">Bảng vẽ tương tác</span>
          </button>
        </div>
      )}

      {/* GAME CONTENT CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Game Screen */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-purple-100 shadow-xs">
          {/* 1. CỜ CARO */}
          {((mode === 'online' && currentRoom?.gameType === 'caro') ||
            (mode === 'local' && selectedGameType === 'caro')) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Trận đấu Cờ Caro (Gomoku 15x15)</h3>
                  <p className="text-xs text-slate-500">
                    {mode === 'online'
                      ? `Lượt chơi hiện tại: Quân ${currentRoom?.gameState?.turn || 'X'}`
                      : `Chơi cục bộ: Lượt của Quân ${localCaroTurn} ${
                          localCaroWinner ? `(Người chiến thắng: ${localCaroWinner} 🎉)` : ''
                        }`}
                  </p>
                </div>

                <button
                  onClick={() => {
                    if (mode === 'online' && currentRoom) {
                      sendWsMessage('game:action', { roomId: currentRoom.id, action: 'rematch', data: {} });
                      showToast('Đã gửi yêu cầu chơi ván mới!');
                    } else {
                      handleResetLocalCaro();
                    }
                  }}
                  className="px-3.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Ván mới</span>
                </button>
              </div>

              {/* Caro Board 15x15 */}
              <div className="overflow-x-auto flex justify-center py-2">
                <div className="inline-grid grid-cols-15 gap-[1px] bg-slate-300 p-1 rounded-xl shadow-inner max-w-full">
                  {(mode === 'online'
                    ? currentRoom?.gameState?.board || localCaroBoard
                    : localCaroBoard
                  ).map((row: (string | null)[], rIdx: number) =>
                    row.map((cell: string | null, cIdx: number) => (
                      <button
                        key={`${rIdx}-${cIdx}`}
                        onClick={() => {
                          if (mode === 'online') {
                            handleOnlineCaroMove(rIdx, cIdx);
                          } else {
                            handleLocalCaroClick(rIdx, cIdx);
                          }
                        }}
                        className={`w-6 h-6 sm:w-7 sm:h-7 bg-amber-50/90 hover:bg-purple-100 flex items-center justify-center font-bold text-xs sm:text-sm select-none transition-colors ${
                          cell === 'X'
                            ? 'text-indigo-600 font-extrabold'
                            : cell === 'O'
                            ? 'text-pink-600 font-extrabold'
                            : ''
                        }`}
                      >
                        {cell}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. OẲN TÙ TÌ */}
          {((mode === 'online' && currentRoom?.gameType === 'rps') ||
            (mode === 'local' && selectedGameType === 'rps')) && (
            <div className="space-y-6 text-center py-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Oẳn Tù Tì Bestie (Kéo - Búa - Bao)</h3>
                <p className="text-xs text-slate-500 mt-1">
                  {mode === 'online'
                    ? 'Chọn bí mật của bạn. Kết quả sẽ được server tiết lộ khi cả hai bên đều chọn!'
                    : 'Chế độ 2 người chơi lần lượt trên cùng 1 máy'}
                </p>
              </div>

              {mode === 'online' ? (
                <div className="space-y-6">
                  {currentRoom?.gameState?.roundResult ? (
                    <div className="p-6 bg-purple-50 rounded-2xl border border-purple-200 space-y-4">
                      <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                        Kết quả hiệp đấu
                      </span>
                      <div className="flex items-center justify-center gap-8 text-3xl">
                        <div className="text-center">
                          <span className="block text-4xl mb-1">
                            {currentRoom.gameState.roundResult.c1 === 'rock' ? '✊' : currentRoom.gameState.roundResult.c1 === 'paper' ? '✋' : '✌️'}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Người chơi 1</span>
                        </div>
                        <span className="text-xl font-bold text-purple-400">VS</span>
                        <div className="text-center">
                          <span className="block text-4xl mb-1">
                            {currentRoom.gameState.roundResult.c2 === 'rock' ? '✊' : currentRoom.gameState.roundResult.c2 === 'paper' ? '✋' : '✌️'}
                          </span>
                          <span className="text-xs font-bold text-slate-700">Người chơi 2</span>
                        </div>
                      </div>

                      <p className="text-base font-bold text-purple-900">
                        {currentRoom.gameState.roundResult.winner === 'draw'
                          ? '🤝 Hai bên hòa nhau!'
                          : `🎉 Người thắng hiệp: ${currentRoom.players.find(p => p.id === currentRoom.gameState.roundResult.winner)?.name || 'Bạn'}!`}
                      </p>

                      <button
                        onClick={() =>
                          sendWsMessage('game:action', {
                            roomId: currentRoom.id,
                            action: 'next_round',
                            data: {}
                          })
                        }
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold text-xs rounded-xl shadow-xs hover:from-purple-700 hover:to-pink-600"
                      >
                        Hiệp tiếp theo
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs font-semibold text-slate-600">
                        Chọn nước đi bí mật của bạn:
                      </p>
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => handleOnlineRpsChoice('rock')}
                          className="w-24 h-24 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-purple-50 hover:bg-purple-100 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                        >
                          <span className="text-4xl">✊</span>
                          <span className="text-xs font-bold text-purple-900">Búa</span>
                        </button>
                        <button
                          onClick={() => handleOnlineRpsChoice('paper')}
                          className="w-24 h-24 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-purple-50 hover:bg-purple-100 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                        >
                          <span className="text-4xl">✋</span>
                          <span className="text-xs font-bold text-purple-900">Bao</span>
                        </button>
                        <button
                          onClick={() => handleOnlineRpsChoice('scissors')}
                          className="w-24 h-24 rounded-2xl border-2 border-purple-200 hover:border-purple-600 bg-purple-50 hover:bg-purple-100 flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-xs"
                        >
                          <span className="text-4xl">✌️</span>
                          <span className="text-xs font-bold text-purple-900">Kéo</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex justify-center gap-8 text-xs font-bold">
                    <span className="text-indigo-600">P1: {localRpsScore.p1} điểm</span>
                    <span className="text-pink-600">P2: {localRpsScore.p2} điểm</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-2">
                      <span className="font-bold text-xs text-indigo-900 block">Người chơi 1</span>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setLocalRpsP1('rock')}
                          className={`p-2 rounded-xl text-xl ${localRpsP1 === 'rock' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                        >
                          ✊
                        </button>
                        <button
                          onClick={() => setLocalRpsP1('paper')}
                          className={`p-2 rounded-xl text-xl ${localRpsP1 === 'paper' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                        >
                          ✋
                        </button>
                        <button
                          onClick={() => setLocalRpsP1('scissors')}
                          className={`p-2 rounded-xl text-xl ${localRpsP1 === 'scissors' ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                        >
                          ✌️
                        </button>
                      </div>
                    </div>

                    <div className="p-4 bg-pink-50 rounded-2xl border border-pink-100 space-y-2">
                      <span className="font-bold text-xs text-pink-900 block">Người chơi 2</span>
                      <div className="flex justify-center gap-1.5">
                        <button
                          onClick={() => setLocalRpsP2('rock')}
                          className={`p-2 rounded-xl text-xl ${localRpsP2 === 'rock' ? 'bg-pink-600 text-white' : 'bg-white'}`}
                        >
                          ✊
                        </button>
                        <button
                          onClick={() => setLocalRpsP2('paper')}
                          className={`p-2 rounded-xl text-xl ${localRpsP2 === 'paper' ? 'bg-pink-600 text-white' : 'bg-white'}`}
                        >
                          ✋
                        </button>
                        <button
                          onClick={() => setLocalRpsP2('scissors')}
                          className={`p-2 rounded-xl text-xl ${localRpsP2 === 'scissors' ? 'bg-pink-600 text-white' : 'bg-white'}`}
                        >
                          ✌️
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    disabled={!localRpsP1 || !localRpsP2}
                    onClick={() => handleLocalRpsSubmit(localRpsP1!, localRpsP2!)}
                    className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    Xem kết quả phân định
                  </button>

                  {localRpsResult && (
                    <div className="p-3 bg-purple-100 rounded-xl text-purple-900 font-bold text-sm">
                      {localRpsResult}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 3. ĐỐ VUI TRẮC NGHIỆM */}
          {((mode === 'online' && currentRoom?.gameType === 'quiz') ||
            (mode === 'local' && selectedGameType === 'quiz')) && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold text-purple-600 uppercase">
                    Câu hỏi {localQuizIndex + 1} / {quizQuestions.length}
                  </span>
                  <h3 className="font-bold text-base text-slate-800 mt-0.5">
                    {quizQuestions[localQuizIndex].q}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Điểm: {localQuizScore}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {quizQuestions[localQuizIndex].options.map((opt, oIdx) => {
                  const isChosen = localQuizSelected === oIdx;
                  const isCorrect = oIdx === quizQuestions[localQuizIndex].correct;
                  const showResult = localQuizSelected !== null;

                  let btnStyle = 'border-slate-200 bg-white hover:border-purple-300 text-slate-700';
                  if (showResult) {
                    if (isCorrect) btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold';
                    else if (isChosen) btnStyle = 'border-rose-500 bg-rose-50 text-rose-900';
                  }

                  return (
                    <button
                      key={oIdx}
                      disabled={showResult}
                      onClick={() => {
                        setLocalQuizSelected(oIdx);
                        if (isCorrect) {
                          setLocalQuizScore((prev) => prev + 100);
                          showToast('Chính xác! +100 điểm 🌟');
                        } else {
                          showToast('Tiếc quá, chưa chính xác rồi!');
                        }
                      }}
                      className={`p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs shrink-0">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>

              {localQuizSelected !== null && (
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200 space-y-3">
                  <p className="text-xs text-purple-900 leading-relaxed">
                    💡 <strong>Giải thích:</strong> {quizQuestions[localQuizIndex].explain}
                  </p>
                  <button
                    onClick={() => {
                      setLocalQuizSelected(null);
                      if (localQuizIndex < quizQuestions.length - 1) {
                        setLocalQuizIndex((prev) => prev + 1);
                      } else {
                        showToast(`Hoàn thành thử thách! Tổng điểm của bạn: ${localQuizScore}`);
                        setLocalQuizIndex(0);
                      }
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                  >
                    {localQuizIndex < quizQuestions.length - 1 ? 'Câu tiếp theo' : 'Chơi lại từ đầu'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 4. ĐOÁN TỪ & VẼ HÌNH */}
          {((mode === 'online' && currentRoom?.gameType === 'draw') ||
            (mode === 'local' && selectedGameType === 'draw')) && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-base">Đoán Từ & Đoán Hình (Pictionary)</h3>
                  <p className="text-xs text-slate-500">
                    Từ khóa cần vẽ: <span className="font-bold text-purple-700 text-sm">"{currentWordToDraw}"</span>
                  </p>
                </div>

                {/* Drawing Tools */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {['#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#1e293b'].map((color) => (
                      <button
                        key={color}
                        onClick={() => setDrawColor(color)}
                        style={{ backgroundColor: color }}
                        className={`w-6 h-6 rounded-full border-2 transition-transform ${
                          drawColor === color ? 'scale-110 border-white shadow-xs' : 'border-transparent'
                        }`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa trắng bảng vẽ"
                  >
                    <Eraser className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Canvas Box */}
              <div className="relative border-2 border-dashed border-purple-200 rounded-2xl overflow-hidden bg-white shadow-inner flex justify-center">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={340}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  className="cursor-crosshair touch-none w-full max-w-[600px] h-[320px] bg-white"
                />
              </div>

              {/* Guessing submission bar */}
              <form onSubmit={handleGuessSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={guessInput}
                  onChange={(e) => setGuessInput(e.target.value)}
                  placeholder="Gõ dự đoán từ khóa của bạn vào đây..."
                  className="flex-1 px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-400 focus:bg-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all shrink-0"
                >
                  Đoán từ!
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Right Side: Room Leaderboard & Live In-Room Chat */}
        <div className="lg:col-span-4 space-y-4">
          {/* Players Roster */}
          <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-purple-600" />
              <span>Bảng điểm phòng đấu</span>
            </h4>

            <div className="space-y-2">
              {(currentRoom ? currentRoom.players : [
                { id: currentUser.id, name: currentUser.name, avatar: currentUser.avatar, score: 100 },
                { id: 'u2', name: 'Minh Khởi', avatar: '/src/assets/images/avatar_minh_khoi_1791969350797.jpg', score: 80 }
              ]).map((player, idx) => (
                <div
                  key={player.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-purple-600 w-4">#{idx + 1}</span>
                    <img
                      src={player.avatar}
                      alt={player.name}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="font-semibold text-xs text-slate-800">{player.name}</span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                    {player.score} đ
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time In-Room Chat */}
          <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs flex flex-col h-[340px]">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-pink-500" />
              <span>Trò chuyện trong phòng</span>
            </h4>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
              {roomMessages.length === 0 ? (
                <div className="text-center text-slate-400 py-10">
                  <p>Chưa có tin nhắn nào. Hãy gửi lời chào đến đồng đội!</p>
                </div>
              ) : (
                roomMessages.map((msg) => (
                  <div key={msg.id} className="p-2 bg-purple-50/70 rounded-xl">
                    <span className="font-bold text-purple-800 block text-[11px]">{msg.userName}:</span>
                    <span className="text-slate-700 text-xs">{msg.text}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSendChat} className="mt-2 flex gap-1.5 pt-2 border-t border-slate-100">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhắn tin cho hội bạn..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-purple-400"
              />
              <button
                type="submit"
                className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
