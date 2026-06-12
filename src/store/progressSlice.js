import { MAPS } from "../config/maps";
import { PROGRESS_STORAGE_KEY, FIRST_MAP_KEY, TOTAL_LEVELS } from "../config/constants";

function loadProgress() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { unlockedMaps: [FIRST_MAP], mapLevels: {} };
        const parsed = JSON.parse(raw);
        if (!parsed.unlockedMaps.includes(FIRST_MAP)) {
            parsed.unlockedMaps = [FIRST_MAP, ...(parsed.unlockedMaps ?? [])];
        }
        if (!parsed.mapLevels) parsed.mapLevels = {};
        return parsed;
    } catch {
        return { unlockedMaps: [FIRST_MAP], mapLevels: {} };
    }
}

function saveProgress(data) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch { }
}

const initial = loadProgress();

export const progressState = {
    unlockedMaps: initial.unlockedMaps,
    mapLevels: initial.mapLevels,    // { forest: 2, desert: 0, ... } — nivel completado (0 = ninguno)
    currentLevel: 0,                    // nivel activo en la partida actual (0-indexed)
};

export function createProgressSlice(set, get) {
    return {
        // Llamado antes de startMap para fijar el nivel
        setCurrentLevel: (level) => set({ currentLevel: level }),

        // Nivel completado — avanzar al siguiente o desbloquear nuevo mapa
        advanceLevel: () => {
            const { currentMapKey, currentLevel, unlockedMaps, mapLevels } = get();
            const maps = Object.values(MAPS).sort((a, b) => a.order - b.order);
            const currentMap = maps.find((m) => m.key === currentMapKey);
            const nextLevelIndex = currentLevel + 1;
            const isLastLevel = nextLevelIndex >= TOTAL_LEVELS;

            // Guardar nivel más alto completado para este mapa
            const prevBest = mapLevels[currentMapKey] ?? -1;
            const newMapLevels = {
                ...mapLevels,
                [currentMapKey]: Math.max(prevBest, currentLevel),
            };

            let newUnlocked = [...unlockedMaps];

            if (isLastLevel) {
                // Último nivel del mapa — desbloquear el siguiente mapa
                const currentIndex = maps.findIndex((m) => m.key === currentMapKey);
                const nextMap = maps[currentIndex + 1];
                if (nextMap && !newUnlocked.includes(nextMap.key)) {
                    newUnlocked = [...newUnlocked, nextMap.key];
                }
            }

            saveProgress({ unlockedMaps: newUnlocked, mapLevels: newMapLevels });
            set({
                unlockedMaps: newUnlocked,
                mapLevels: newMapLevels,
            });

            // Retornar info para que GameOver sepa qué mostrar
            return {
                isLastLevel,
                nextLevelIndex: isLastLevel ? 0 : nextLevelIndex,
                unlockedNewMap: isLastLevel
                    ? (() => {
                        const ci = maps.findIndex((m) => m.key === currentMapKey);
                        const nm = maps[ci + 1];
                        return nm && !unlockedMaps.includes(nm.key) ? nm : null;
                    })()
                    : null,
                isVeryLastLevel: isLastLevel && (() => {
                    const ci = maps.findIndex((m) => m.key === currentMapKey);
                    return ci === maps.length - 1;
                })(),
            };
        },

        getMapProgress: (mapKey) => {
            const { mapLevels } = get();
            return mapLevels[mapKey] ?? -1; // -1 = sin completar ningún nivel
        },

        unlockAllMaps: () => {
            const all = Object.keys(MAPS);
            const mapLevels = {};
            saveProgress({ unlockedMaps: all, mapLevels });
            set({ unlockedMaps: all, mapLevels });
        },

        resetProgress: () => {
            saveProgress({ unlockedMaps: [FIRST_MAP], mapLevels: {} });
            set({ unlockedMaps: [FIRST_MAP], mapLevels: {}, currentLevel: 0 });
        },
    };
}