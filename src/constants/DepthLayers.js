/**
 * Depth layer constants for Phaser game objects.
 * Ensures proper z-ordering: Background < Entity < Player < UI < Debug
 */

// Background layers (0-6)
export const DEPTH_BG = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6
};

// Entity layers (9-50)
export const DEPTH_ENTITY = {
    SHADOW: 9,
    SPARK: 10,
    HEALTH_BAR: 11,
    RING: 12,
    PROJECTILE: 15,
    BASE: 20,
    GLOW: 30,
    LABEL: 49,
    TOP: 50
};

// Player layer
export const DEPTH_PLAYER = 100;

// UI layers (98-250+)
export const DEPTH_UI = {
    BACKGROUND: 98,
    TEXT: 99,
    BARS: 150,
    COMBO: 151,
    ICONS: 180,
    TOAST: 200,
    OVERLAY: 250
};

// Effect layers
export const DEPTH_EFFECT = {
    BUBBLE: 7,
    FLOATING_TEXT: 99
};

// Debug overlay (always on top)
export const DEPTH_DEBUG = 9999;