import { CollisionSystem } from '../CollisionSystem.js';

// Mock player
const createMockPlayer = (size = 30) => ({
    playerData: { size },
    x: 100,
    y: 100
});

// Mock fish
const createMockFish = (size = 20, type = 'clownfish', exp = 10, eaten = false) => ({
    fishData: { size, exp, strongAgainst: [] },
    fishType: type,
    getData: (key) => key === 'eaten' ? eaten : null,
    x: 110,
    y: 100
});

// Standard fishData including key type relationships
const FISH_DATA = {
    clownfish:  { strongAgainst: [] },
    shrimp:     { strongAgainst: [] },
    shark:      { strongAgainst: ['clownfish'] },
    octopus:    { strongAgainst: ['seahorse'] },
    seahorse:   { strongAgainst: [] }
};

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

        test('onCollisionResult defaults to no-op', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(), fishData: {} });
            expect(() => cs.onCollisionResult({})).not.toThrow();
        });
    });

    describe('checkCollision - already eaten (short-circuit)', () => {
        test('returns already_eaten when fish.getData("eaten") is true', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(), fishData: {} });
            const fish = createMockFish(20, 'clownfish', 10, true); // eaten=true
            const result = cs.checkCollision(createMockPlayer(), fish);
            expect(result.type).toBe('already_eaten');
            expect(result.canEat).toBe(false);
        });
    });

    describe('checkCollision - eat path', () => {
        test('player can eat smaller fish when size > 1.2x', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(40),
                fishData: FISH_DATA
            });
            // 40 > 30 * 1.2 = 36 ✓
            const result = cs.checkCollision(createMockPlayer(40), createMockFish(30, 'shrimp'));
            expect(result.canEat).toBe(true);
            expect(result.type).toBe('eat');
            expect(result.expGain).toBe(10);
        });

        test('expGain is taken from fish.fishData.exp', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(50), fishData: FISH_DATA });
            const fish = createMockFish(30, 'shrimp', 25);
            const result = cs.checkCollision(createMockPlayer(50), fish);
            expect(result.expGain).toBe(25);
        });

        test('cannot eat if fish is strong against player (type-blocked while large enough)', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(60),
                fishData: FISH_DATA
            });
            // shark.strongAgainst includes 'clownfish' → blocked even if player is bigger
            const result = cs.checkCollision(createMockPlayer(60), createMockFish(40, 'shark'));
            expect(result.canEat).toBe(false);
            expect(result.type).toBe('blocked');
            expect(result.reason).toBe('strong_against');
        });

        test('borderline size: exactly 1.2x → cannot eat', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(36), fishData: FISH_DATA });
            // 36 > 30 * 1.2 = 36 → NOT strictly greater → blocked
            const result = cs.checkCollision(createMockPlayer(36), createMockFish(30, 'shrimp'));
            expect(result.canEat).toBe(false);
        });

        test('borderline size: just above 1.2x → can eat', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(37), fishData: FISH_DATA });
            // 37 > 30 * 1.2 = 36 ✓
            const result = cs.checkCollision(createMockPlayer(37), createMockFish(30, 'shrimp'));
            expect(result.canEat).toBe(true);
        });
    });

    describe('checkCollision - damage path', () => {
        test('player takes damage when fish is more than 1.2x larger', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(30),
                fishData: FISH_DATA
            });
            // 40 > 30 * 1.2 = 36 ✓
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(40, 'shrimp'));
            expect(result.type).toBe('damaged');
            expect(result.damage).toBe(10); // Math.floor(40 / 4)
        });

        test('damage is Math.floor(fishSize / 4)', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(20), fishData: FISH_DATA });
            const result = cs.checkCollision(createMockPlayer(20), createMockFish(50, 'shrimp'));
            expect(result.damage).toBe(12); // Math.floor(50/4) = 12
        });

        test('type-blocked: fish strong against player → no damage even if larger', () => {
            const cs = new CollisionSystem({
                scene: {},
                player: createMockPlayer(30),
                fishData: FISH_DATA
            });
            // shark.strongAgainst = ['clownfish'] → when shark is bigger, still blocked
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(40, 'shark'));
            expect(result.type).toBe('blocked');
            expect(result.reason).toBe('strong_against');
        });
    });

    describe('checkCollision - similar size (no interaction)', () => {
        test('no interaction when sizes are within 1.2x of each other', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(30), fishData: FISH_DATA });
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(30, 'shrimp'));
            expect(result.type).toBe('blocked');
            expect(result.reason).toBe('similar_size');
            expect(result.canEat).toBe(false);
        });

        test('size 30 vs 28 → similar (28 * 1.2 = 33.6 > 30) → blocked', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(30), fishData: FISH_DATA });
            const result = cs.checkCollision(createMockPlayer(30), createMockFish(28, 'shrimp'));
            expect(result.type).toBe('blocked');
        });
    });

    describe('type relationship coverage', () => {
        test('octopus strong against seahorse → blocked when player tries to eat octopus via seahorse (type check)', () => {
            // octopus.strongAgainst = ['seahorse']
            // Player type is 'clownfish', so octopus is NOT strong against player → can eat if big enough
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(60), fishData: FISH_DATA });
            const result = cs.checkCollision(createMockPlayer(60), createMockFish(40, 'octopus'));
            expect(result.canEat).toBe(true);
        });

        test('shark strong against clownfish → blocked', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(60), fishData: FISH_DATA });
            const result = cs.checkCollision(createMockPlayer(60), createMockFish(40, 'shark'));
            expect(result.canEat).toBe(false);
            expect(result.reason).toBe('strong_against');
        });
    });

    describe('reset', () => {
        test('reset does not throw', () => {
            const cs = new CollisionSystem({ scene: {}, player: createMockPlayer(), fishData: {} });
            expect(() => cs.reset()).not.toThrow();
        });
    });
});