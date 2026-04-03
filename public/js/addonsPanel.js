import { state } from "./state.js";

export function renderAddonsPanel() {
  const addons = document.getElementById("addons");
  const tasks = document.getElementById("taskPool");
  if (!addons || !tasks) return;

  addons.innerHTML = "";
  (state.activeAddons || []).forEach((modifier) => {
    const tag = document.createElement("span");
    tag.className = "addon-tag";
    tag.textContent = modifier.name;
    addons.appendChild(tag);
  });

  tasks.innerHTML = "";
  (state.taskPool || []).forEach((task) => {
    const li = document.createElement("li");
    li.textContent = task;
    tasks.appendChild(li);
  });
}
