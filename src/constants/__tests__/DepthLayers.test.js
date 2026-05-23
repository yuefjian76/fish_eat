import { DEPTH_BG, DEPTH_ENTITY, DEPTH_PLAYER, DEPTH_UI, DEPTH_EFFECT, DEPTH_DEBUG } from '../DepthLayers.js';

describe('DepthLayers', () => {
    describe('DEPTH_BG (Background layers)', () => {
        test('DEPTH_BG_0 equals 0', () => {
            expect(DEPTH_BG[0]).toBe(0);
        });

        test('DEPTH_BG_1 equals 1', () => {
            expect(DEPTH_BG[1]).toBe(1);
        });

        test('DEPTH_BG_2 equals 2', () => {
            expect(DEPTH_BG[2]).toBe(2);
        });

        test('DEPTH_BG_3 equals 3', () => {
            expect(DEPTH_BG[3]).toBe(3);
        });

        test('DEPTH_BG_4 equals 4', () => {
            expect(DEPTH_BG[4]).toBe(4);
        });

        test('DEPTH_BG_5 equals 5', () => {
            expect(DEPTH_BG[5]).toBe(5);
        });

        test('DEPTH_BG_6 equals 6', () => {
            expect(DEPTH_BG[6]).toBe(6);
        });
    });

    describe('DEPTH_ENTITY (Game entities)', () => {
        test('DEPTH_ENTITY_SHADOW equals 9', () => {
            expect(DEPTH_ENTITY.SHADOW).toBe(9);
        });

        test('DEPTH_ENTITY_SPARK equals 10', () => {
            expect(DEPTH_ENTITY.SPARK).toBe(10);
        });

        test('DEPTH_ENTITY_HEALTH_BAR equals 11', () => {
            expect(DEPTH_ENTITY.HEALTH_BAR).toBe(11);
        });

        test('DEPTH_ENTITY_RING equals 12', () => {
            expect(DEPTH_ENTITY.RING).toBe(12);
        });

        test('DEPTH_ENTITY_PROJECTILE equals 15', () => {
            expect(DEPTH_ENTITY.PROJECTILE).toBe(15);
        });

        test('DEPTH_ENTITY_BASE equals 20', () => {
            expect(DEPTH_ENTITY.BASE).toBe(20);
        });

        test('DEPTH_ENTITY_GLOW equals 30', () => {
            expect(DEPTH_ENTITY.GLOW).toBe(30);
        });

        test('DEPTH_ENTITY_LABEL equals 49', () => {
            expect(DEPTH_ENTITY.LABEL).toBe(49);
        });

        test('DEPTH_ENTITY_TOP equals 50', () => {
            expect(DEPTH_ENTITY.TOP).toBe(50);
        });
    });

    describe('DEPTH_PLAYER (Player depth)', () => {
        test('DEPTH_PLAYER equals 100', () => {
            expect(DEPTH_PLAYER).toBe(100);
        });
    });

    describe('DEPTH_UI (UI elements)', () => {
        test('DEPTH_UI_BACKGROUND equals 98', () => {
            expect(DEPTH_UI.BACKGROUND).toBe(98);
        });

        test('DEPTH_UI_TEXT equals 99', () => {
            expect(DEPTH_UI.TEXT).toBe(99);
        });

        test('DEPTH_UI_BARS equals 150', () => {
            expect(DEPTH_UI.BARS).toBe(150);
        });

        test('DEPTH_UI_COMBO equals 151', () => {
            expect(DEPTH_UI.COMBO).toBe(151);
        });

        test('DEPTH_UI_ICONS equals 180', () => {
            expect(DEPTH_UI.ICONS).toBe(180);
        });

        test('DEPTH_UI_TOAST equals 200', () => {
            expect(DEPTH_UI.TOAST).toBe(200);
        });

        test('DEPTH_UI_OVERLAY equals 250', () => {
            expect(DEPTH_UI.OVERLAY).toBe(250);
        });
    });

    describe('DEPTH_EFFECT (Effects)', () => {
        test('DEPTH_EFFECT_BUBBLE equals 7', () => {
            expect(DEPTH_EFFECT.BUBBLE).toBe(7);
        });

        test('DEPTH_EFFECT_FLOATING_TEXT equals 99', () => {
            expect(DEPTH_EFFECT.FLOATING_TEXT).toBe(99);
        });
    });

    describe('DEPTH_DEBUG (Debug overlay)', () => {
        test('DEPTH_DEBUG equals 9999', () => {
            expect(DEPTH_DEBUG).toBe(9999);
        });
    });

    describe('depth ordering invariants', () => {
        test('all DEPTH_BG values are less than any DEPTH_ENTITY value', () => {
            const bgValues = Object.values(DEPTH_BG);
            const entityValues = Object.values(DEPTH_ENTITY);
            const maxBg = Math.max(...bgValues);
            const minEntity = Math.min(...entityValues);
            expect(maxBg).toBeLessThan(minEntity);
        });

        test('all DEPTH_ENTITY values are less than DEPTH_PLAYER', () => {
            const entityValues = Object.values(DEPTH_ENTITY);
            const maxEntity = Math.max(...entityValues);
            expect(maxEntity).toBeLessThan(DEPTH_PLAYER);
        });

        test('core DEPTH_UI values (BARS, COMBO, ICONS, TOAST, OVERLAY) are greater than DEPTH_PLAYER', () => {
            const coreUiValues = [
                DEPTH_UI.BARS,
                DEPTH_UI.COMBO,
                DEPTH_UI.ICONS,
                DEPTH_UI.TOAST,
                DEPTH_UI.OVERLAY
            ];
            const minCoreUi = Math.min(...coreUiValues);
            expect(minCoreUi).toBeGreaterThan(DEPTH_PLAYER);
        });

        test('DEPTH_DEBUG is greater than all other depths', () => {
            const allDepths = [
                ...Object.values(DEPTH_BG),
                ...Object.values(DEPTH_ENTITY),
                DEPTH_PLAYER,
                ...Object.values(DEPTH_UI),
                ...Object.values(DEPTH_EFFECT)
            ];
            const maxOther = Math.max(...allDepths);
            expect(DEPTH_DEBUG).toBeGreaterThan(maxOther);
        });
    });
});