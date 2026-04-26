import { jest } from '@jest/globals';
import { MapExpansionSystem } from '../MapExpansionSystem.js';

describe('MapExpansionSystem', () => {
    let mapExpansionSystem;
    const mockZonesData = {
        zones: [
            {
                id: 'shallow',
                name: '浅海',
                minDistance: 0,
                maxDistance: 1000,
                tint: 16777215,
                bubbleColor: 11445693,
                enemyLevelRange: [1, 3],
                bossType: null,
                backgrounds: ['bg_tropical_theme'],
                midgrounds: ['midground_tropical_theme']
            },
            {
                id: 'coral',
                name: '珊瑚礁',
                minDistance: 1000,
                maxDistance: 2500,
                tint: 16769373,
                bubbleColor: 16761065,
                enemyLevelRange: [3, 6],
                bossType: null,
                backgrounds: ['bg_undersea_theme'],
                midgrounds: ['midground_undersea_theme']
            },
            {
                id: 'deep',
                name: '深海',
                minDistance: 2500,
                maxDistance: 4500,
                tint: 8519815,
                bubbleColor: 6299568,
                enemyLevelRange: [6, 9],
                bossType: null,
                backgrounds: ['bg_undersea_theme'],
                midgrounds: ['midground_undersea_theme']
            },
            {
                id: 'abyss',
                name: '深渊',
                minDistance: 4500,
                maxDistance: 999999,
                tint: 2031613,
                bubbleColor: 328704,
                enemyLevelRange: [9, 12],
                bossType: 'boss_sea_dragon',
                backgrounds: ['bg_undersea_theme'],
                midgrounds: ['midground_undersea_theme']
            }
        ]
    };

    beforeEach(() => {
        mapExpansionSystem = new MapExpansionSystem(mockZonesData);
    });

    describe('constructor', () => {
        test('initializes with world position at origin', () => {
            expect(mapExpansionSystem.worldX).toBe(0);
            expect(mapExpansionSystem.worldY).toBe(0);
        });

        test('initializes with shallow zone as default', () => {
            expect(mapExpansionSystem.getCurrentZone().id).toBe('shallow');
        });

        test('loads zones from config', () => {
            expect(mapExpansionSystem.zones.length).toBe(4);
        });

        test('initializes with no zone transition callback', () => {
            expect(mapExpansionSystem.onZoneTransition).toBeNull();
        });
    });

    describe('updatePlayerPosition', () => {
        test('updates worldX and worldY', () => {
            mapExpansionSystem.updatePlayerPosition(100, 200);
            expect(mapExpansionSystem.worldX).toBe(100);
            expect(mapExpansionSystem.worldY).toBe(200);
        });

        test('triggers zone transition when crossing boundary', () => {
            const callback = jest.fn();
            mapExpansionSystem.onZoneTransition = callback;

            // Start at shallow zone (0, 0)
            mapExpansionSystem.updatePlayerPosition(0, 0);

            // Move to coral zone (distance > 1000)
            mapExpansionSystem.updatePlayerPosition(1000, 0);

            expect(callback).toHaveBeenCalledWith(
                expect.objectContaining({ id: 'coral' }),
                expect.objectContaining({ id: 'shallow' })
            );
        });

        test('does not trigger callback when staying in same zone', () => {
            const callback = jest.fn();
            mapExpansionSystem.onZoneTransition = callback;

            mapExpansionSystem.updatePlayerPosition(500, 0);
            mapExpansionSystem.updatePlayerPosition(600, 0);

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('getCurrentZone', () => {
        test('returns shallow zone at origin', () => {
            const zone = mapExpansionSystem.getCurrentZone();
            expect(zone.id).toBe('shallow');
            expect(zone.name).toBe('浅海');
        });

        test('returns coral zone beyond 1000 distance', () => {
            mapExpansionSystem.updatePlayerPosition(1001, 0);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('coral');
        });

        test('returns deep zone beyond 2500 distance', () => {
            mapExpansionSystem.updatePlayerPosition(2501, 0);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('deep');
        });

        test('returns abyss zone beyond 4500 distance', () => {
            mapExpansionSystem.updatePlayerPosition(4501, 0);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('abyss');
        });

        test('returns correct zone for negative coordinates (2D distance)', () => {
            mapExpansionSystem.updatePlayerPosition(-1001, 0);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('coral');
        });

        test('returns correct zone for diagonal distance', () => {
            // sqrt(500^2 + 500^2) ~= 707, still in shallow
            mapExpansionSystem.updatePlayerPosition(500, 500);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('shallow');

            // sqrt(800^2 + 800^2) ~= 1131, in coral
            mapExpansionSystem.updatePlayerPosition(800, 800);
            expect(mapExpansionSystem.getCurrentZone().id).toBe('coral');
        });
    });

    describe('getDistanceFromOrigin', () => {
        test('returns 0 at origin', () => {
            expect(mapExpansionSystem.getDistanceFromOrigin()).toBe(0);
        });

        test('returns correct distance for positive coordinates', () => {
            mapExpansionSystem.updatePlayerPosition(300, 400);
            // Distance = sqrt(300^2 + 400^2) = 500
            expect(mapExpansionSystem.getDistanceFromOrigin()).toBe(500);
        });

        test('returns correct distance for negative coordinates', () => {
            mapExpansionSystem.updatePlayerPosition(-300, -400);
            expect(mapExpansionSystem.getDistanceFromOrigin()).toBe(500);
        });

        test('returns correct distance for mixed coordinates', () => {
            mapExpansionSystem.updatePlayerPosition(300, -400);
            expect(mapExpansionSystem.getDistanceFromOrigin()).toBe(500);
        });
    });

    describe('getEnemyLevelRange', () => {
        test('returns enemy level range for current zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getEnemyLevelRange()).toEqual([1, 3]);
        });

        test('returns coral zone enemy range', () => {
            mapExpansionSystem.updatePlayerPosition(1500, 0);
            expect(mapExpansionSystem.getEnemyLevelRange()).toEqual([3, 6]);
        });

        test('returns deep zone enemy range', () => {
            mapExpansionSystem.updatePlayerPosition(3000, 0);
            expect(mapExpansionSystem.getEnemyLevelRange()).toEqual([6, 9]);
        });

        test('returns abyss zone enemy range', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 0);
            expect(mapExpansionSystem.getEnemyLevelRange()).toEqual([9, 12]);
        });
    });

    describe('getZoneById', () => {
        test('returns zone by id', () => {
            const zone = mapExpansionSystem.getZoneById('coral');
            expect(zone).not.toBeNull();
            expect(zone.name).toBe('珊瑚礁');
        });

        test('returns null for invalid id', () => {
            const zone = mapExpansionSystem.getZoneById('invalid_zone');
            expect(zone).toBeNull();
        });
    });

    describe('setZoneTransitionCallback', () => {
        test('sets the callback', () => {
            const callback = jest.fn();
            mapExpansionSystem.setZoneTransitionCallback(callback);
            expect(mapExpansionSystem.onZoneTransition).toBe(callback);
        });
    });

    describe('reset', () => {
        test('resets position to origin', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 5000);
            mapExpansionSystem.reset();
            expect(mapExpansionSystem.worldX).toBe(0);
            expect(mapExpansionSystem.worldY).toBe(0);
        });

        test('resets current zone to shallow', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 5000);
            mapExpansionSystem.reset();
            expect(mapExpansionSystem.getCurrentZone().id).toBe('shallow');
        });
    });

    describe('getZoneTint', () => {
        test('returns tint for current zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getZoneTint()).toBe(16777215);
        });

        test('returns tint for abyss zone', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 0);
            expect(mapExpansionSystem.getZoneTint()).toBe(2031613);
        });
    });

    describe('getZoneBubbleColor', () => {
        test('returns bubble color for shallow zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getZoneBubbleColor()).toBe(11445693);
        });

        test('returns bubble color for abyss zone', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 0);
            expect(mapExpansionSystem.getZoneBubbleColor()).toBe(328704);
        });
    });

    describe('getZoneBackgrounds', () => {
        test('returns backgrounds for current zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getZoneBackgrounds()).toEqual(['bg_tropical_theme']);
        });
    });

    describe('getZoneMidgrounds', () => {
        test('returns midgrounds for current zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getZoneMidgrounds()).toEqual(['midground_tropical_theme']);
        });
    });

    describe('hasBoss', () => {
        test('returns false for shallow zone', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.hasBoss()).toBe(false);
        });

        test('returns true for abyss zone', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 0);
            expect(mapExpansionSystem.hasBoss()).toBe(true);
        });

        test('returns boss type for abyss zone', () => {
            mapExpansionSystem.updatePlayerPosition(5000, 0);
            expect(mapExpansionSystem.getBossType()).toBe('boss_sea_dragon');
        });

        test('returns null for non-boss zones', () => {
            mapExpansionSystem.updatePlayerPosition(0, 0);
            expect(mapExpansionSystem.getBossType()).toBeNull();
        });
    });
});
