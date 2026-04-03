let ws = new WebSocket("ws://localhost:3000");

const state = {
  id: null,
  players: {},
};

ws.onopen = () => {
  console.log("Connected to the server!");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "startGame") {
    state.players = data.players;
    updateUI();
  }
  if (data.type === "update") {
    state.players = data.players;
    updateUI();
  }
  if (data.type === "banned") {
    alert("You have been banned from the game.");
  }
};

function updateUI() {
  const playerList = document.getElementById("playerList");
  playerList.innerHTML = "";
  Object.keys(state.players).forEach((id) => {
    const player = state.players[id];
    const playerDiv = document.createElement("div");
    playerDiv.textContent = `${player.name} (${player.role})`;
    playerList.appendChild(playerDiv);
  });
}

document.addEventListener("keydown", (e) => {
  const player = state.players[state.id];
  if (!player) return;

  if (e.key === "q") {
    if (player.role === "scientist") {
      ws.send(JSON.stringify({ type: "vitals" }));
    }
    if (player.role === "engineer") {
      ws.send(JSON.stringify({ type: "vent" }));
    }
    if (player.role === "phantom") {
      ws.send(JSON.stringify({ type: "invisible" }));
    }
  }
});

function setRole(role) {
  ws.send(JSON.stringify({ type: "admin", action: "role", role, target: state.id }));
}
