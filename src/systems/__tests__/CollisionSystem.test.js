import { CollisionSystem } from '../CollisionSystem.js';

// Mock player
const createMockPlayer = (size = 30) => ({
    playerData: { size },
    x: 100,
    y: 100
});

// Mock fish
const createMockFish = (size = 20, type = 'clownfish', exp = 10) => ({
    fishData: { size, exp, strongAgainst: [] },
    fishType: type,
    getData: (key) => null,
    x: 110,
    y: 100
});

describe('CollisionSystem', () => {
    describe('initialization', () => {
        test('creates collision system', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(),
                fishData: {}
            });
            expect(cs).toBeDefined();
        });
    });

    describe('checkCollision - can eat', () => {
        test('player can eat smaller fish (size > 1.2x)', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(40),
                fishData: { clownfish: { strongAgainst: [] } }
            });
            const result = cs.checkCollision(createMockPlayer(40), createMockFish(30));
            expect(result.canEat).toBe(true);
            expect(result.type).toBe('eat');
        });

        test('player cannot eat fish if fish is strong against player', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(40),
                fishData: {
                    clownfish: { strongAgainst: ['clownfish'] },
                    shrimp: { strongAgainst: [] }
                }
            });
            const result = cs.checkCollision(createMockPlayer(40), createMockFish(30, 'clownfish'));
            expect(result.canEat).toBe(false);
            expect(result.reason).toBe('strong_against');
        });
    });

    describe('checkCollision - take damage', () => {
        test('player takes damage from larger fish', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(30),
                fishData: { shark: { strongAgainst: [] } }
            });
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(40, 'shark'));
            expect(result.type).toBe('damaged');
            expect(result.damage).toBe(10); // fishSize / 4 = 40 / 4
        });

        test('player takes no damage if fish is strong against player', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(30),
                fishData: {
                    clownfish: { strongAgainst: ['clownfish'] },
                    shark: { strongAgainst: [] }
                }
            });
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(40, 'clownfish'));
            expect(result.type).toBe('blocked');
            expect(result.reason).toBe('strong_against');
        });
    });

    describe('checkCollision - similar size', () => {
        test('no interaction when sizes are similar', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(30),
                fishData: {}
            });
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(30));
            expect(result.canEat).toBe(false);
            expect(result.type).toBe('blocked');
            expect(result.reason).toBe('similar_size');
        });
    });

    describe('checkCollision - already eaten', () => {
        test('returns already_eaten for eaten fish', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(),
                fishData: {}
            });
            const fish = createMockFish();
            fish.getData = (key) => key === 'eaten' ? true : null;
            const result = cs.checkCollision(createMockPlayer(), fish);
            expect(result.type).toBe('already_eaten');
            expect(result.canEat).toBe(false);
        });
    });

    describe('reset', () => {
        test('reset does not throw', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(),
                fishData: {}
            });
            expect(() => cs.reset()).not.toThrow();
        });
    });
});