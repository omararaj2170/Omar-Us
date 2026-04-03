import { state } from "./state.js";

let lastImagePath = "";

export function renderMapImage() {
  const map = document.getElementById("mapImage");
  if (!map) return;

  if (state.mapImage !== lastImagePath) {
    map.src = state.mapImage;
    map.alt = state.map?.name ? `${state.map.name} tactical map` : "Map background";
    lastImagePath = state.mapImage;
  }
}
