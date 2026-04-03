import { patchState } from "./state.js";

let ws;

export function connect() {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  ws = new WebSocket(`${protocol}://${window.location.host}`);

  ws.addEventListener("open", () => {
    patchState({ connected: true, status: "connected" });
  });

  ws.addEventListener("close", () => {
    patchState({ connected: false, status: "disconnected" });
  });

  ws.addEventListener("message", (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "joined") {
      patchState({
        id: data.id,
        room: data.room,
        gameName: data.gameName,
      });
      return;
    }

    if (data.type === "state") {
      patchState({
        gameName: data.gameName,
        map: data.map,
        mapImage: `/assets/maps/${data.map?.image || "skeld-classic.svg"}`,
        borders: data.borders,
        activeAddons: data.activeAddons,
        status: data.status,
        meetingActive: data.meetingActive,
        taskProgress: data.taskProgress,
        taskGoal: data.taskGoal,
        announcement: data.announcement,
        players: data.players,
        sabotages: data.sabotages,
        taskPool: data.taskPool || [],
      });
      return;
    }

    if (data.type === "vitals") {
      console.table(data.vitals);
      return;
    }

    if (data.type === "error") {
      console.error(data.message);
      return;
    }

    if (data.type === "banned") {
      alert(data.message || "Banned");
    }
  });
}

export function send(type, payload = {}) {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  ws.send(JSON.stringify({ type, ...payload }));
}
