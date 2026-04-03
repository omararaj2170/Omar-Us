import { state } from "./state.js";

export function renderBorders() {
  const canvas = document.getElementById("mapCanvas");
  if (!canvas || !state.borders) return;

  const context = canvas.getContext("2d");
  const { zones, width, height } = state.borders;

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  context.strokeStyle = "rgba(0, 200, 255, 0.7)";
  context.fillStyle = "rgba(0, 20, 40, 0.2)";
  context.lineWidth = 3;
  context.font = "14px sans-serif";

  zones.forEach((zone) => {
    context.strokeRect(zone.x, zone.y, zone.w, zone.h);
    context.fillRect(zone.x, zone.y, zone.w, zone.h);
    context.fillStyle = "#a9ddff";
    context.fillText(zone.name, zone.x + 8, zone.y + 20);
    context.fillStyle = "rgba(0, 20, 40, 0.2)";
  });
}
