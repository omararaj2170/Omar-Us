class AddonSystem {
  constructor(config) {
    this.modifiers = config.modifiers || [];
  }

  pickRoomModifiers(roomCode) {
    const seed = roomCode.length;
    return this.modifiers.filter((_, index) => (index + seed) % 2 === 0);
  }

  toEffectMap(roomModifiers) {
    return roomModifiers.reduce(
      (effects, modifier) => ({
        ...effects,
        ...modifier.effects,
      }),
      {}
    );
  }

  summarize(roomModifiers) {
    if (roomModifiers.length === 0) return "No active modifiers.";
    return roomModifiers.map((modifier) => modifier.name).join(", ");
  }
}

module.exports = { AddonSystem };
