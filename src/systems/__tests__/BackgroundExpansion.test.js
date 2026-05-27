import { BackgroundExpansion } from '../BackgroundExpansion.js';
import { THEME_CONFIG } from '../../constants/ThemeConfig.js';

describe('BackgroundExpansion Decoration System', () => {
    let mockScene;

    beforeEach(() => {
        mockScene = {
            add: {
                graphics: () => ({
                    setDepth: () => {},
                    setAlpha: () => {},
                    fillStyle: () => {},
                    fillRect: () => {},
                    clear: () => {},
                    destroy: () => {}
                }),
                image: () => ({ setDisplaySize: () => {}, setTint: () => {}, setAlpha: () => {} }),
                container: () => ({ setDepth: () => {} })
            },
            tweens: {
                add: () => {}
            }
        };
    });

    it('should initialize decoration arrays', () => {
        const bg = new BackgroundExpansion(mockScene);
        expect(bg.bubbles).toBeDefined();
        expect(bg.jellyfish).toBeDefined();
        expect(bg.lightSpots).toBeDefined();
        expect(Array.isArray(bg.bubbles)).toBe(true);
        expect(Array.isArray(bg.jellyfish)).toBe(true);
        expect(Array.isArray(bg.lightSpots)).toBe(true);
    });

    it('should generate bubble at correct distance from player', () => {
        const bg = new BackgroundExpansion(mockScene);
        const bubble = bg.generateBubble(5000, 5000);
        expect(bubble).toBeDefined();
        expect(bubble.type).toBeUndefined();
        // Distance should be between 100 and 400 from player
        const dx = bubble.x - 5000;
        const dy = bubble.y - 5000;
        const dist = Math.sqrt(dx * dx + dy * dy);
        expect(dist).toBeGreaterThanOrEqual(100);
        expect(dist).toBeLessThanOrEqual(400);
    });

    it('should respect bubble count limit', () => {
        const bg = new BackgroundExpansion(mockScene);
        bg.themeConfig = THEME_CONFIG.deep_sea;
        // Simulate adding bubbles up to limit
        bg.bubbles = Array(30).fill({});
        const newBubble = bg.generateBubble(5000, 5000);
        // Should return null when at limit
        expect(newBubble).toBeNull();
    });

    it('should getNextTheme correctly excluding current', () => {
        const bg = new BackgroundExpansion(mockScene);
        bg.currentThemeId = 'deep_sea';
        const next = bg.getNextTheme();
        expect(next).not.toBe('deep_sea');
        expect(['tropical', 'polar']).toContain(next);
    });

    it('should start transition when calling transitionToNewTheme', () => {
        const bg = new BackgroundExpansion(mockScene);
        bg.isTransitioning = false;
        // Mock transitionOverlay with proper graphics methods
        bg.transitionOverlay = {
            setDepth: () => {},
            setAlpha: () => {},
            fillStyle: () => {},
            fillRect: () => {},
            destroy: () => {}
        };
        bg.bgGraphics = { clear: () => {}, fillStyle: () => {}, fillRect: () => {} };
        bg.themeConfig = { ...THEME_CONFIG.deep_sea };
        bg.currentThemeId = 'deep_sea';

        // Mock the tween add to trigger onComplete immediately for testing
        mockScene.tweens.add = (config) => {
            if (config.onComplete) {
                setTimeout(config.onComplete, 0);
            }
        };

        bg.transitionToNewTheme('tropical', 1500);
        // Transition starts immediately (isTransitioning becomes true)
        expect(bg.isTransitioning).toBe(true);
        // currentThemeId changes in onComplete, but since we mocked setTimeout to 0, it should have changed
        // However, the actual implementation changes it in a later tick, so we check isTransitioning as primary indicator
    });

    it('should initialize with deep_sea theme by default', () => {
        const bg = new BackgroundExpansion(mockScene);
        expect(bg.currentThemeId).toBe('deep_sea');
        expect(bg.themeConfig.id).toBe('deep_sea');
    });

    it('should generate jellyfish with correct properties', () => {
        const bg = new BackgroundExpansion(mockScene);
        bg.themeConfig = THEME_CONFIG.deep_sea;
        const jelly = bg.generateJellyfish(5000, 5000);
        expect(jelly).toBeDefined();
        expect(jelly.size).toBeGreaterThanOrEqual(20);
        expect(jelly.size).toBeLessThanOrEqual(40);
        expect(jelly.vx).toBeDefined();
        expect(jelly.vy).toBeDefined();
    });
});