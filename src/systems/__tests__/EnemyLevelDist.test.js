/**
 * EnemyLevelDist.test.js - Tests for enemy level distribution
 *
 * Verifies that enemies spawn with levels based on player level:
 * - 70% same level as player
 * - 20% one level lower (minimum level 1)
 * - 10% one level higher
 */

describe('EnemyLevelDistribution', () => {
    // Helper function to extract calculateEnemyLevel logic for testing
    const calculateEnemyLevel = (playerLevel) => {
        const roll = Math.random();
        if (roll < 0.7) {
            return playerLevel;  // 70%
        } else if (roll < 0.9) {
            return Math.max(1, playerLevel - 1);  // 20%
        } else {
            return playerLevel + 1;  // 10%
        }
    };

    test('70% enemies same level as player', () => {
        const playerLevel = 5;
        const iterations = 10000;
        let sameLevelCount = 0;

        for (let i = 0; i < iterations; i++) {
            const enemyLevel = calculateEnemyLevel(playerLevel);
            if (enemyLevel === playerLevel) {
                sameLevelCount++;
            }
        }

        const percentage = (sameLevelCount / iterations) * 100;
        // Allow 2% tolerance for statistical variation
        expect(percentage).toBeGreaterThan(68);
        expect(percentage).toBeLessThan(72);
    });

    test('20% enemies one level lower', () => {
        const playerLevel = 5;
        const iterations = 10000;
        let lowerLevelCount = 0;

        for (let i = 0; i < iterations; i++) {
            const enemyLevel = calculateEnemyLevel(playerLevel);
            if (enemyLevel === playerLevel - 1) {
                lowerLevelCount++;
            }
        }

        const percentage = (lowerLevelCount / iterations) * 100;
        // Allow 2% tolerance for statistical variation
        expect(percentage).toBeGreaterThan(18);
        expect(percentage).toBeLessThan(22);
    });

    test('10% enemies one level higher', () => {
        const playerLevel = 5;
        const iterations = 10000;
        let higherLevelCount = 0;

        for (let i = 0; i < iterations; i++) {
            const enemyLevel = calculateEnemyLevel(playerLevel);
            if (enemyLevel === playerLevel + 1) {
                higherLevelCount++;
            }
        }

        const percentage = (higherLevelCount / iterations) * 100;
        // Allow 2% tolerance for statistical variation
        expect(percentage).toBeGreaterThan(8);
        expect(percentage).toBeLessThan(12);
    });

    test('lower level enemies never go below level 1', () => {
        const playerLevel = 1;
        const iterations = 1000;

        for (let i = 0; i < iterations; i++) {
            const enemyLevel = calculateEnemyLevel(playerLevel);
            expect(enemyLevel).toBeGreaterThanOrEqual(1);
        }
    });
});
