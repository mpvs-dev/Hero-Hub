// src/store/lobbySlice.js

import { HEROES } from "../config/heroes";

export const PLAYER_HEROES = Object.values(HEROES);

export const lobbyState = {
  screen: "lobby", // 'lobby' | 'modeSelect' | 'mapSelect' | 'abilitySelect' | 'game'
  roster: [null, null, null],
  activeSlot: null,
  chosenAbilities: [null, null, null],
  pendingMapKey: null,
  selectedMode: null, // 'campaign' | 'infinite' | 'versus'
};

export function createLobbySlice(set, get) {
  return {
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

    setHeroAbility: (slotIndex, abilityKey) =>
      set((state) => {
        const next = [...state.chosenAbilities];
        next[slotIndex] = next[slotIndex] === abilityKey ? null : abilityKey;
        return { chosenAbilities: next };
      }),

    // Lobby → ModeSelect (requiere roster completo)
    goToModeSelect: () => {
      const { roster } = get();
      if (roster.some((k) => k === null)) return;
      set({ screen: "modeSelect", activeSlot: null });
    },

    // ModeSelect → siguiente pantalla según el modo
    selectMode: (mode) => {
      set({ selectedMode: mode });
      if (mode === "campaign") {
        set({ screen: "mapSelect" });
      }
      // 'infinite' y 'versus' se quedan en modeSelect por ahora (coming soon)
    },

    // MapSelect → AbilitySelect
    goToAbilitySelect: (mapKey) => {
      set({ screen: "abilitySelect", pendingMapKey: mapKey });
    },

    // AbilitySelect → Game
    confirmAbilities: () => {
      const { chosenAbilities, roster, pendingMapKey } = get();
      if (roster.some((_, i) => chosenAbilities[i] === null)) return;
      if (!pendingMapKey) return;
      get().startMap(pendingMapKey);
    },

    // Volver al lobby desde cualquier pantalla previa al juego
    backToLobby: () =>
      set({
        screen: "lobby",
        activeSlot: null,
        chosenAbilities: [null, null, null],
        pendingMapKey: null,
        selectedMode: null,
      }),

    // Volver a ModeSelect desde MapSelect
    backToModeSelect: () =>
      set({
        screen: "modeSelect",
        chosenAbilities: [null, null, null],
        pendingMapKey: null,
      }),

    // Volver a MapSelect desde AbilitySelect
    backToMapSelect: () =>
      set({
        screen: "mapSelect",
        chosenAbilities: [null, null, null],
        pendingMapKey: null,
      }),
  };
}