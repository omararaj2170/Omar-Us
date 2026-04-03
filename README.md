# Starfall Syndicate

A modular social-deduction game prototype inspired by teamwork/deception gameplay loops.

## Run locally

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

## Deploy on Render

- Runtime: **Node**
- Build command: `npm install`
- Start command: `npm start`
- The app automatically reads `process.env.PORT` (required by Render) with fallback to `data/settings.json`.

## Project structure

- `server/index.js` - HTTP + WebSocket entrypoint
- `server/gameEngine.js` - game loop, room state, roles, voting, abilities, addons
- `server/systems/ventSystem.js` - dedicated vent network/cooldown logic
- `server/systems/addonSystem.js` - room modifier/addon logic
- `public/index.html` - web client shell
- `public/js/*.js` - modular frontend state/actions/render/controls/socket/map/border/addons
- `public/assets/maps/*.svg` - image maps
- `data/*.json` and `data/addons/*.json` - roles, maps, borders, vents, tasks, settings, addons


## Included map

- `Skeld Classic` is the default in-game map image with room names tracked in `data/maps.json` and borders in `data/borders.json`.
