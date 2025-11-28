import { WebSocket, WebSocketServer } from "ws";
import type { Server } from "http";

export interface Player {
  id: string;
  name: string;
  ws: WebSocket;
}

export interface GameRoom {
  id: string;
  players: Player[];
  gameType: "tictactoe" | "flappybird";
  status: "waiting" | "playing" | "finished";
  gameState?: any;
  scores?: { [playerId: string]: number };
}

const rooms = new Map<string, GameRoom>();
const playerRooms = new Map<string, string>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket) => {
    let playerId: string;
    let currentRoomId: string;

    ws.on("message", (data: string) => {
      try {
        const message = JSON.parse(data);

        switch (message.type) {
          case "join":
            handleJoin(ws, message, (id, roomId) => {
              playerId = id;
              currentRoomId = roomId;
            });
            break;

          case "create_room":
            handleCreateRoom(ws, message, (id, roomId) => {
              playerId = id;
              currentRoomId = roomId;
            });
            break;

          case "game_move":
            handleGameMove(currentRoomId, playerId, message);
            break;

          case "game_action":
            handleGameAction(currentRoomId, playerId, message);
            break;

          case "list_rooms":
            handleListRooms(ws);
            break;

          case "leave":
            handleLeaveRoom(currentRoomId, playerId);
            currentRoomId = "";
            break;
        }
      } catch (err) {
        console.error("WebSocket message error:", err);
      }
    });

    ws.on("close", () => {
      if (currentRoomId && playerId) {
        handleLeaveRoom(currentRoomId, playerId);
      }
    });
  });
}

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function handleJoin(
  ws: WebSocket,
  message: any,
  setIds: (playerId: string, roomId: string) => void
) {
  const { room_id, player_name } = message;
  const room = rooms.get(room_id);

  if (!room) {
    ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
    return;
  }

  if (room.players.length >= 2) {
    ws.send(JSON.stringify({ type: "error", message: "Room is full" }));
    return;
  }

  const playerId = generateId();
  const player = { id: playerId, name: player_name, ws };
  room.players.push(player);
  playerRooms.set(playerId, room_id);
  setIds(playerId, room_id);

  broadcastToRoom(room_id, {
    type: "player_joined",
    player_id: playerId,
    player_name: player_name,
    players: room.players.map((p) => ({ id: p.id, name: p.name })),
  });

  if (room.players.length === 2) {
    room.status = "playing";
    broadcastToRoom(room_id, {
      type: "game_start",
      players: room.players.map((p) => ({ id: p.id, name: p.name })),
    });
  }
}

function handleCreateRoom(
  ws: WebSocket,
  message: any,
  setIds: (playerId: string, roomId: string) => void
) {
  const { game_type, player_name } = message;
  const roomId = generateId();
  const playerId = generateId();

  const room: GameRoom = {
    id: roomId,
    players: [{ id: playerId, name: player_name, ws }],
    gameType: game_type,
    status: "waiting",
    gameState: game_type === "tictactoe" ? Array(12).fill(null) : null,
    scores: {},
  };

  rooms.set(roomId, room);
  playerRooms.set(playerId, roomId);
  setIds(playerId, roomId);

  ws.send(
    JSON.stringify({
      type: "room_created",
      room_id: roomId,
      player_id: playerId,
    })
  );
}

function handleGameMove(
  roomId: string,
  playerId: string,
  message: any
) {
  const room = rooms.get(roomId);
  if (!room) return;

  broadcastToRoom(roomId, {
    type: "move",
    player_id: playerId,
    data: message.data,
  });
}

function handleGameAction(
  roomId: string,
  playerId: string,
  message: any
) {
  const room = rooms.get(roomId);
  if (!room) return;

  broadcastToRoom(roomId, {
    type: "action",
    player_id: playerId,
    action: message.action,
    data: message.data,
  });
}

function handleListRooms(ws: WebSocket) {
  const availableRooms = Array.from(rooms.values())
    .filter((r) => r.status === "waiting" && r.players.length < 2)
    .map((r) => ({
      id: r.id,
      game_type: r.gameType,
      player_count: r.players.length,
      host: r.players[0]?.name,
    }));

  ws.send(JSON.stringify({ type: "rooms_list", rooms: availableRooms }));
}

function handleLeaveRoom(roomId: string, playerId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter((p) => p.id !== playerId);
  playerRooms.delete(playerId);

  if (room.players.length === 0) {
    rooms.delete(roomId);
  } else {
    broadcastToRoom(roomId, {
      type: "player_left",
      player_id: playerId,
      players: room.players.map((p) => ({ id: p.id, name: p.name })),
    });
  }
}

function broadcastToRoom(roomId: string, message: any) {
  const room = rooms.get(roomId);
  if (!room) return;

  room.players.forEach((player) => {
    if (player.ws.readyState === WebSocket.OPEN) {
      player.ws.send(JSON.stringify(message));
    }
  });
}
