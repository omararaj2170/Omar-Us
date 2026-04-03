import { connect } from "./socketClient.js";
import { joinGame } from "./actions.js";
import { renderUI } from "./render.js";
import { installControls } from "./controls.js";
import { renderMapImage } from "./mapRenderer.js";
import { renderBorders } from "./borderRenderer.js";
import { renderAddonsPanel } from "./addonsPanel.js";

function bootstrap() {
  connect();
  installControls();

  const name = prompt("Enter your player name", "Pilot");
  const room = prompt("Enter room code", "ORBIT");
  joinGame(name || "Pilot", room || "ORBIT");

  setInterval(() => {
    renderUI();
    renderMapImage();
    renderBorders();
    renderAddonsPanel();
  }, 120);
}

bootstrap();
