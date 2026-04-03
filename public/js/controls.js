import { state } from "./state.js";
import { movePlayer, completeTask, useAbility, reportBody, callMeeting, vote } from "./actions.js";

function moveBy(dx, dy) {
  const me = state.players[state.id];
  const nextX = (me?.x || 0) + dx;
  const nextY = (me?.y || 0) + dy;
  movePlayer(nextX, nextY);
}

export function installControls() {
  document.addEventListener("keydown", (event) => {
    switch (event.key.toLowerCase()) {
      case "arrowup":
        moveBy(0, -1);
        break;
      case "arrowdown":
        moveBy(0, 1);
        break;
      case "arrowleft":
        moveBy(-1, 0);
        break;
      case "arrowright":
        moveBy(1, 0);
        break;
      case "t": {
        const nextTask = state.taskPool[Math.floor(Math.random() * (state.taskPool.length || 1))] || `task-${Date.now()}`;
        completeTask(nextTask);
        break;
      }
      case "v":
        useAbility("vent");
        break;
      case "x":
        useAbility("vitals");
        break;
      case "i":
        useAbility("invisible");
        break;
      case "r":
        reportBody();
        break;
      case "m":
        callMeeting();
        break;
      case "1": {
        const firstTarget = Object.keys(state.players).find((id) => id !== state.id) || "skip";
        vote(firstTarget);
        break;
      }
      default:
        break;
    }
  });
}
