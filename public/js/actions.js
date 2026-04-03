import { send } from "./socketClient.js";

export function joinGame(name, room) {
  send("join", { name, room });
}

export function movePlayer(x, y) {
  send("move", { x, y });
}

export function completeTask(taskId) {
  send("completeTask", { taskId });
}

export function useAbility(ability, target) {
  send("ability", { ability, target });
}

export function reportBody() {
  send("report");
}

export function callMeeting() {
  send("meeting");
}

export function vote(target) {
  send("vote", { target });
}

export function adminCommand(action, target, payload = {}) {
  send("admin", {
    adminKey: "647523",
    action,
    target,
    ...payload,
  });
}
