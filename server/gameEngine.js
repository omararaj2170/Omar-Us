const fs = require("fs");
const path = require("path");
const { VentSystem } = require("./systems/ventSystem");
const { AddonSystem } = require("./systems/addonSystem");

const rolesData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/roles.json"), "utf8"));
const mapsData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/maps.json"), "utf8"));
const settingsData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/settings.json"), "utf8"));
const ventData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/vents.json"), "utf8"));
const borderData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/borders.json"), "utf8"));
const addonData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/addons/modifiers.json"), "utf8"));
const tasksData = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/tasks.json"), "utf8"));

const ALL_ROLES = [...rolesData.crew, ...rolesData.infiltrators];

const settings = {
  ...settingsData,
  port: Number(process.env.PORT || settingsData.port || 3000),
};

class GameEngine {
  constructor() {
    this.rooms = {};
    this.bannedPlayers = new Set();
    this.ventSystem = new VentSystem(ventData);
    this.addonSystem = new AddonSystem(addonData);
  }

  ensureRoom(roomCode) {
    if (!this.rooms[roomCode]) {
      const map = mapsData.maps[0];
      const modifiers = this.addonSystem.pickRoomModifiers(roomCode);
      this.rooms[roomCode] = {
        code: roomCode,
        map,
        borders: borderData[map.id] || null,
        players: {},
        meetingActive: false,
        votes: {},
        taskProgress: 0,
        taskGoal: map.taskGoal,
        sabotages: {},
        status: "running",
        modifiers,
        modifierEffects: this.addonSystem.toEffectMap(modifiers),
        taskPool: tasksData.taskPools[map.id] || [],
      };
    }

    return this.rooms[roomCode];
  }

  removePlayer(roomCode, playerId) {
    const room = this.rooms[roomCode];
    if (!room) return;

    delete room.players[playerId];
    this.broadcastState(room, `${playerId} disconnected.`);
  }

  join({ ws, name, roomCode }) {
    const cleanName = (name || "Pilot").trim();
    const cleanRoom = (roomCode || settings.defaultRoom).trim().toUpperCase();

    if (!cleanName) {
      this.safeSend(ws, { type: "error", message: "Name is required." });
      return null;
    }

    if (this.bannedPlayers.has(cleanName.toLowerCase())) {
      this.safeSend(ws, { type: "banned", message: "You are banned from this server." });
      return null;
    }

    const room = this.ensureRoom(cleanRoom);

    if (Object.keys(room.players).length >= settings.maxPlayers) {
      this.safeSend(ws, { type: "error", message: "Room is full." });
      return null;
    }

    if (room.players[cleanName]) {
      this.safeSend(ws, { type: "error", message: "Name already in use in this room." });
      return null;
    }

    room.players[cleanName] = {
      id: cleanName,
      name: cleanName,
      ws,
      role: rolesData.crew[0],
      alive: true,
      x: 0,
      y: 0,
      tasksCompleted: 0,
      invisibleUntil: 0,
      trackerTarget: null,
      shieldUntil: 0,
      abilities: [],
    };

    this.assignRoles(room);
    this.safeSend(ws, {
      type: "joined",
      id: cleanName,
      room: cleanRoom,
      gameName: settings.gameName,
      activeAddons: this.addonSystem.summarize(room.modifiers),
    });
    this.broadcastState(room, `${cleanName} joined the match.`);

    return { playerId: cleanName, roomCode: cleanRoom };
  }

  assignRoles(room) {
    const ids = Object.keys(room.players);
    ids.forEach((id, index) => {
      const role = ALL_ROLES[index % ALL_ROLES.length];
      room.players[id].role = role;
      room.players[id].abilities = rolesData.abilityByRole[role] || [];
    });
  }

  handleMove(roomCode, playerId, x, y) {
    const room = this.rooms[roomCode];
    const player = this.getPlayer(roomCode, playerId);
    if (!room || !player || !player.alive) return;

    const maxX = 20;
    const maxY = 20;
    player.x = Math.max(0, Math.min(maxX, Number(x) || 0));
    player.y = Math.max(0, Math.min(maxY, Number(y) || 0));
    this.broadcastState(room);
  }

  completeTask(roomCode, playerId, taskId) {
    const room = this.rooms[roomCode];
    const player = this.getPlayer(roomCode, playerId);
    if (!room || !player || !player.alive) return;

    const multiplier = room.modifierEffects.taskMultiplier || 1;
    player.tasksCompleted += multiplier;
    room.taskProgress += multiplier;

    if (room.taskProgress >= room.taskGoal) {
      room.status = "crew_win";
      this.broadcastState(room, "Crew objective complete. Crew wins!");
      return;
    }

    this.broadcastState(room, `${playerId} completed ${taskId || "a task"}.`);
  }

  useAbility(roomCode, playerId, ability, target) {
    const room = this.rooms[roomCode];
    const player = this.getPlayer(roomCode, playerId);
    if (!room || !player || !player.alive) return;
    if (!player.abilities.includes(ability)) return;

    switch (ability) {
      case "vent": {
        const canVent = this.ventSystem.canVent(roomCode, playerId, player.role, player.abilities);
        if (!canVent.ok) {
          this.safeSend(player.ws, { type: "error", message: canVent.reason });
          return;
        }

        const ventBoost = room.modifierEffects.ventBoost || 1;
        const nextPosition = this.ventSystem.vent(
          roomCode,
          playerId,
          room.map.id,
          { x: player.x, y: player.y },
          ventBoost
        );

        if (!nextPosition.ok) {
          this.safeSend(player.ws, { type: "error", message: nextPosition.reason });
          return;
        }

        player.x = nextPosition.x;
        player.y = nextPosition.y;
        this.broadcastState(room, `${playerId} vented from ${nextPosition.from} to ${nextPosition.to}.`);
        break;
      }
      case "vitals": {
        const vitals = Object.values(room.players).map((p) => ({ id: p.id, alive: p.alive }));
        this.safeSend(player.ws, { type: "vitals", vitals });
        break;
      }
      case "invisible":
        player.invisibleUntil = Date.now() + 8000;
        this.broadcastState(room, `${playerId} vanished for a moment.`);
        break;
      case "track":
        if (room.players[target]) {
          player.trackerTarget = target;
          this.broadcastState(room, `${playerId} attached a tracker beacon.`);
        }
        break;
      case "shield":
        player.shieldUntil = Date.now() + 10000;
        this.broadcastState(room, `${playerId} activated a temporary shield.`);
        break;
      case "speedBurst":
        player.x = Math.min(20, player.x + 5);
        player.y = Math.min(20, player.y + 5);
        this.broadcastState(room, `${playerId} used speed burst.`);
        break;
      default:
        this.broadcastState(room, `${playerId} used ${ability}.`);
        break;
    }
  }

  startMeeting(roomCode, kind) {
    const room = this.rooms[roomCode];
    if (!room) return;

    room.meetingActive = true;
    room.votes = {};

    let announcement = kind === "report" ? "Body reported!" : "Emergency meeting started.";
    if (room.modifierEffects.announcementTrim) {
      announcement = kind === "report" ? "Report." : "Meeting.";
    }

    this.broadcastState(room, announcement);
  }

  vote(roomCode, playerId, target) {
    const room = this.rooms[roomCode];
    const player = this.getPlayer(roomCode, playerId);
    if (!room || !player || !room.meetingActive || !player.alive) return;

    room.votes[playerId] = target || "skip";
    const livingCount = Object.values(room.players).filter((p) => p.alive).length;

    if (Object.keys(room.votes).length >= livingCount) {
      this.resolveVotes(room);
    } else {
      this.broadcastState(room, `${playerId} has voted.`);
    }
  }

  resolveVotes(room) {
    const tally = {};
    Object.values(room.votes).forEach((candidate) => {
      tally[candidate] = (tally[candidate] || 0) + 1;
    });

    let ejected = "skip";
    let topVotes = 0;

    Object.entries(tally).forEach(([candidate, votes]) => {
      if (votes > topVotes) {
        topVotes = votes;
        ejected = candidate;
      }
    });

    if (ejected !== "skip" && room.players[ejected]) {
      room.players[ejected].alive = false;
      this.broadcastState(room, `${ejected} was ejected.`);
    } else {
      this.broadcastState(room, "No ejection this round.");
    }

    room.votes = {};
    room.meetingActive = false;
    this.evaluateWin(room);
  }

  evaluateWin(room) {
    const living = Object.values(room.players).filter((p) => p.alive);
    const infiltratorCount = living.filter((p) => rolesData.infiltrators.includes(p.role)).length;
    const crewCount = living.length - infiltratorCount;

    if (infiltratorCount === 0) {
      room.status = "crew_win";
      this.broadcastState(room, "All infiltrators eliminated. Crew wins!");
      return;
    }

    if (infiltratorCount >= crewCount) {
      room.status = "infiltrator_win";
      this.broadcastState(room, "Infiltrators have taken over.");
    }
  }

  handleAdmin(roomCode, action, target, extra) {
    const room = this.rooms[roomCode];
    if (!room) return;

    if (action === "kick" && room.players[target]) {
      this.safeSend(room.players[target].ws, { type: "error", message: "You were kicked by host." });
      room.players[target].ws.close();
      delete room.players[target];
    }

    if (action === "ban" && room.players[target]) {
      this.bannedPlayers.add(target.toLowerCase());
      this.safeSend(room.players[target].ws, { type: "banned", message: "You were banned by host." });
      room.players[target].ws.close();
      delete room.players[target];
    }

    if (action === "role" && room.players[target]) {
      room.players[target].role = extra.role || room.players[target].role;
      room.players[target].abilities = rolesData.abilityByRole[room.players[target].role] || [];
    }

    if (action === "sabotage") {
      const sabotage = extra.kind || "lights";
      room.sabotages[sabotage] = true;
    }

    this.broadcastState(room, "Host changed room settings.");
  }

  broadcastState(room, announcement = "") {
    const now = Date.now();
    const players = Object.fromEntries(
      Object.entries(room.players).map(([id, p]) => [
        id,
        {
          id: p.id,
          name: p.name,
          role: p.role,
          alive: p.alive,
          x: p.x,
          y: p.y,
          tasksCompleted: p.tasksCompleted,
          hidden: p.invisibleUntil > now,
          trackerTarget: p.trackerTarget,
          shielded: p.shieldUntil > now,
          abilities: p.abilities,
        },
      ])
    );

    const payload = {
      type: "state",
      gameName: settings.gameName,
      room: room.code,
      map: room.map,
      borders: room.borders,
      activeAddons: room.modifiers,
      status: room.status,
      meetingActive: room.meetingActive,
      taskProgress: room.taskProgress,
      taskGoal: room.taskGoal,
      sabotages: room.sabotages,
      taskPool: room.taskPool,
      announcement,
      players,
    };

    Object.values(room.players).forEach((player) => this.safeSend(player.ws, payload));
  }

  getPlayer(roomCode, playerId) {
    const room = this.rooms[roomCode];
    if (!room) return null;
    return room.players[playerId] || null;
  }

  safeSend(ws, payload) {
    if (ws.readyState !== ws.OPEN) return;
    ws.send(JSON.stringify(payload));
  }
}

module.exports = {
  GameEngine,
  settings,
};
