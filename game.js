const { Server } = require("ws");
const { assignRoles } = require("./roles");
const { loadBans, isBanned, ban } = require("./admin");

const wss = new Server({ port: 3000 });

let rooms = {};

wss.on("connection", (ws) => {
  let player;
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.type === "join") {
      player = { name: data.name, ws, alive: true, role: "crewmate" };

      // Check for bans
      if (isBanned(player.name)) {
        ws.send(JSON.stringify({ type: "banned" }));
        return;
      }

      // Create a room if it doesn't exist
      if (!rooms[data.room]) {
        rooms[data.room] = { players: {}, sabotages: {} };
      }
      rooms[data.room].players[player.name] = player;

      // Assign roles
      assignRoles(rooms[data.room]);

      ws.send(JSON.stringify({ type: "startGame", players: rooms[data.room].players }));

      // Handle messages from the client (game logic like task completion)
      ws.on("message", (message) => {
        const data = JSON.parse(message);
        if (data.type === "admin") {
          handleAdminCommands(data, rooms[data.room], ws);
        }
      });
    }
  });
});

function handleAdminCommands(data, room, ws) {
  if (data.adminKey !== "647523") return; // Basic admin check

  switch (data.action) {
    case "kick":
      delete room.players[data.target];
      break;
    case "ban":
      ban(data.target);
      break;
    case "role":
      room.players[data.target].role = data.role;
      break;
    case "sabotage":
      room.sabotages[data.kind] = true;
      break;
  }

  ws.send(JSON.stringify({ type: "update", players: room.players }));
}

module.exports = { wss };
