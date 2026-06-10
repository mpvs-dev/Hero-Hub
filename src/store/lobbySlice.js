/**
 * lobbySlice.js
 * Estado y acciones del lobby: roster de héroes, habilidades y navegación.
 */

import { HEROES } from "../config/heroes";

export const PLAYER_HEROES = Object.values(HEROES);

export const lobbyState = {
  screen: "lobby", // 'lobby' | 'abilitySelect' | 'mapSelect' | 'game'
  roster: [null, null, null],
  activeSlot: null,
  chosenAbilities: [null, null, null],
};

export function createLobbySlice(set, get) {
  return {
    // ── Slot de héroe ────────────────────────────────────────
    selectSlot: (slotIndex) =>
      set((state) => ({
        activeSlot: state.activeSlot === slotIndex ? null : slotIndex,
      })),

    assignHero: (heroKey) => {
      const { roster, activeSlot } = get();
      if (activeSlot === null) return;
      const existingSlot = roster.findIndex((k) => k === heroKey);
      if (existingSlot !== -1 && existingSlot !== activeSlot) return;
      const newRoster = [...roster];
      newRoster[activeSlot] = newRoster[activeSlot] === heroKey ? null : heroKey;
      set({ roster: newRoster, activeSlot: null });
    },

    clearSlot: (slotIndex) =>
      set((state) => {
        const newRoster = [...state.roster];
        newRoster[slotIndex] = null;
        return { roster: newRoster, activeSlot: null };
      }),

    // ── Habilidades ──────────────────────────────────────────
    setHeroAbility: (slotIndex, abilityKey) =>
      set((state) => {
        const next = [...state.chosenAbilities];
        next[slotIndex] = next[slotIndex] === abilityKey ? null : abilityKey;
        return { chosenAbilities: next };
      }),

    // ── Navegación ───────────────────────────────────────────
    goToMapSelect: () => {
      const { roster } = get();
      if (roster.some((k) => k === null)) return;
      set({ screen: "abilitySelect", activeSlot: null });
    },

    confirmAbilities: () => {
      const { chosenAbilities, roster } = get();
      if (roster.some((_, i) => chosenAbilities[i] === null)) return;
      set({ screen: "mapSelect" });
    },

    // Conserva el roster pero limpia habilidades y slot activo
    backToLobby: () =>
      set({
        screen: "lobby",
        activeSlot: null,
        chosenAbilities: [null, null, null],
      }),
  };
}
