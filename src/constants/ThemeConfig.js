export const THEME_CONFIG = {
    deep_sea: {
        id: 'deep_sea',
        name: '深海',
        gradientColors: [0x647488, 0x1A2A3C, 0x0D1A24], // [top, mid, bottom]
        tint: 0x647488,
        bubbleColor: 0x88CCFF,
        decoration: {
            bubble: { count: 30, spawnInterval: 200, speed: 80, sizeRange: [3, 12] },
            jellyfish: { count: 5, spawnInterval: 1000, speed: 30, sizeRange: [20, 40] },
            lightSpot: { count: 20, flickerSpeed: 2000 }
        }
    },
    tropical: {
        id: 'tropical',
        name: '热带浅海',
        gradientColors: [0x4FB3D9, 0x45A08A, 0x2D6B63],
        tint: 0x4FB3D9,
        bubbleColor: 0xFFEE88,
        decoration: {
            bubble: { count: 30, spawnInterval: 200, speed: 100, sizeRange: [4, 15] },
            jellyfish: { count: 5, spawnInterval: 1000, speed: 40, sizeRange: [25, 45] },
            lightSpot: { count: 20, flickerSpeed: 1500 }
        }
    },
    polar: {
        id: 'polar',
        name: '极地深海',
        gradientColors: [0x1A1A2E, 0x0D1A24, 0x050510],
        tint: 0x1A1A2E,
        bubbleColor: 0xAABBCC,
        decoration: {
            bubble: { count: 30, spawnInterval: 250, speed: 60, sizeRange: [2, 10] },
            jellyfish: { count: 5, spawnInterval: 1200, speed: 20, sizeRange: [15, 35] },
            lightSpot: { count: 20, flickerSpeed: 3000 }
        }
    }
};

/**
 * Get theme config by theme id
 * @param {string} themeId
 * @returns {object} Theme config
 */
export function getTheme(themeId) {
    return THEME_CONFIG[themeId] || THEME_CONFIG.deep_sea;
}

/**
 * Get random theme excluding current theme
 * @param {string} currentTheme - Current theme id to exclude
 * @returns {string} New theme id
 */
export function getRandomTheme(currentTheme) {
    const themes = Object.keys(THEME_CONFIG).filter(t => t !== currentTheme);
    return themes[Math.floor(Math.random() * themes.length)];
}