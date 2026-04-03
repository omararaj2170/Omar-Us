const path = require("path");
const http = require("http");
const fs = require("fs");
const { WebSocketServer } = require("ws");
const { GameEngine, settings } = require("./gameEngine");

const engine = new GameEngine();

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  const basePath = path.join(__dirname, "../public");
  const requestPath = req.url === "/" ? "/index.html" : req.url;
  const filePath = path.normalize(path.join(basePath, requestPath));

  if (!filePath.startsWith(basePath)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not found");
      return;
    }

    const extension = path.extname(filePath);
    res.writeHead(200, { "Content-Type": MIME_TYPES[extension] || "text/plain" });
    res.end(content);
  });
});

const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  const session = { roomCode: null, playerId: null };

  ws.on("message", (raw) => {
    let message;
    try {
      message = JSON.parse(raw);
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "Invalid JSON." }));
      return;
    }

    switch (message.type) {
      case "join": {
        const result = engine.join({ ws, name: message.name, roomCode: message.room });
        if (result) {
          session.playerId = result.playerId;
          session.roomCode = result.roomCode;
        }
        break;
      }
      case "move":
        engine.handleMove(session.roomCode, session.playerId, message.x, message.y);
        break;
      case "completeTask":
        engine.completeTask(session.roomCode, session.playerId, message.taskId);
        break;
      case "ability":
        engine.useAbility(session.roomCode, session.playerId, message.ability, message.target);
        break;
      case "report":
      case "meeting":
        engine.startMeeting(session.roomCode, message.type);
        break;
      case "vote":
        engine.vote(session.roomCode, session.playerId, message.target);
        break;
      case "admin":
        if (message.adminKey === settings.adminKey) {
          engine.handleAdmin(session.roomCode, message.action, message.target, message);
        }
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: `Unknown message type: ${message.type}` }));
    }
  });

  ws.on("close", () => {
    if (session.roomCode && session.playerId) {
      engine.removePlayer(session.roomCode, session.playerId);
    }
  });
});

server.listen(settings.port, () => {
  console.log(`${settings.gameName} is running at http://localhost:${settings.port}`);
});
