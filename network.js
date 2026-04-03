const ws = new WebSocket("ws://localhost:3000");
const state = {
  id: null,
  players: {},
};

ws.onopen = () => {
  console.log("Connected to the game server!");
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "startGame") {
    state.players = data.players;
    state.id = data.id;
  }
  if (data.type === "update") {
    state.players = data.players;
  }
};

function sendAction(type, actionData) {
  ws.send(JSON.stringify({ type, ...actionData }));
}

function handleMove(x, y) {
  const player = state.players[state.id];
  if (player) {
    player.x = x;
    player.y = y;
    sendAction("move", { x, y });
  }
}

function handleTaskCompletion(taskId) {
  sendAction("completeTask", { taskId });
}

function sendAdminCommand(action, target, extraData = {}) {
  sendAction("admin", {
    action,
    target,
    ...extraData,
  });
}

export { ws, state, handleMove, sendAdminCommand, handleTaskCompletion };
