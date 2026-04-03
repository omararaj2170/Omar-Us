class VentSystem {
  constructor(ventConfig) {
    this.ventConfig = ventConfig;
    this.lastVentAt = {};
    this.defaultCooldownMs = 7000;
  }

  canVent(roomCode, playerId, role, abilities, now = Date.now()) {
    if (!abilities.includes("vent")) {
      return { ok: false, reason: "Role cannot vent." };
    }

    const key = `${roomCode}:${playerId}`;
    const last = this.lastVentAt[key] || 0;
    if (now - last < this.defaultCooldownMs) {
      return { ok: false, reason: "Vent cooling down." };
    }

    return { ok: true };
  }

  vent(roomCode, playerId, mapId, currentPosition, modifier = 1, now = Date.now()) {
    const mapVents = this.ventConfig[mapId];
    if (!mapVents || !mapVents.vents.length) {
      return { ok: false, reason: "No vent network configured." };
    }

    const nearest = this.nearestVent(mapVents.vents, currentPosition);
    const next = this.pickLinkedVent(mapVents, nearest.id);

    if (!next) {
      return { ok: false, reason: "No linked vent found." };
    }

    const boostedStep = Math.max(1, modifier);
    const result = {
      ok: true,
      x: next.x * boostedStep,
      y: next.y * boostedStep,
      from: nearest.id,
      to: next.id,
    };

    this.lastVentAt[`${roomCode}:${playerId}`] = now;
    return result;
  }

  nearestVent(vents, pos) {
    let best = vents[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    vents.forEach((vent) => {
      const distance = Math.abs(vent.x - pos.x) + Math.abs(vent.y - pos.y);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = vent;
      }
    });

    return best;
  }

  pickLinkedVent(mapVents, sourceId) {
    const linkIds = mapVents.links[sourceId] || [];
    if (linkIds.length === 0) return null;

    const chosenId = linkIds[Math.floor(Math.random() * linkIds.length)];
    return mapVents.vents.find((vent) => vent.id === chosenId) || null;
  }
}

module.exports = { VentSystem };
