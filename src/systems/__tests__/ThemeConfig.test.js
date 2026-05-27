import { THEME_CONFIG, getTheme, getRandomTheme } from '../../constants/ThemeConfig.js';

describe('ThemeConfig', () => {
    it('should have three themes: deep_sea, tropical, polar', () => {
        expect(THEME_CONFIG.deep_sea).toBeDefined();
        expect(THEME_CONFIG.tropical).toBeDefined();
        expect(THEME_CONFIG.polar).toBeDefined();
    });

    it('should have gradientColors array for each theme', () => {
        expect(Array.isArray(THEME_CONFIG.deep_sea.gradientColors)).toBe(true);
        expect(THEME_CONFIG.deep_sea.gradientColors.length).toBe(3);
    });

    it('should have decoration config for each theme', () => {
        expect(THEME_CONFIG.deep_sea.decoration.bubble.count).toBe(30);
        expect(THEME_CONFIG.deep_sea.decoration.jellyfish.count).toBe(5);
        expect(THEME_CONFIG.deep_sea.decoration.lightSpot.count).toBe(20);
    });

    it('getTheme should return theme by id', () => {
        const theme = getTheme('deep_sea');
        expect(theme.id).toBe('deep_sea');
    });

    it('getRandomTheme should exclude current theme', () => {
        const themes = ['deep_sea', 'tropical', 'polar'];
        for (const current of themes) {
            const next = getRandomTheme(current);
            expect(next).not.toBe(current);
            expect(themes).toContain(next);
        }
    });
});