export const state = {
  connected: false,
  id: null,
  room: null,
  gameName: "Starfall Syndicate",
  status: "connecting",
  map: null,
  mapImage: "/assets/maps/skeld-classic.svg",
  meetingActive: false,
  taskProgress: 0,
  taskGoal: 0,
  announcement: "",
  players: {},
  sabotages: {},
  borders: null,
  activeAddons: [],
  taskPool: [],
};

export function patchState(partial) {
  Object.assign(state, partial);
}
