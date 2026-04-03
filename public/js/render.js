import { state } from "./state.js";

export function renderUI() {
  const title = document.getElementById("gameTitle");
  const status = document.getElementById("matchStatus");
  const taskProgress = document.getElementById("taskProgress");
  const announcement = document.getElementById("announcement");
  const playerList = document.getElementById("playerList");
  const mapName = document.getElementById("mapName");

  if (title) title.textContent = state.gameName;
  if (status) status.textContent = `Status: ${state.status}`;
  if (taskProgress) taskProgress.textContent = `Tasks: ${state.taskProgress}/${state.taskGoal}`;
  if (announcement) announcement.textContent = state.announcement || "No announcements.";
  if (mapName) mapName.textContent = `Map: ${state.map?.name || "Unknown"}`;

  if (!playerList) return;

  playerList.innerHTML = "";
  Object.values(state.players).forEach((player) => {
    const row = document.createElement("div");
    row.className = "player-row";
    const visibleRole = state.id === player.id ? player.role : "Unknown";
    row.textContent = `${player.name} • ${visibleRole} • ${player.alive ? "alive" : "ghost"} • (${player.x}, ${player.y})`;
    playerList.appendChild(row);
  });
}
