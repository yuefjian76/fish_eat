// src/systems/__tests__/SpawnWeights.test.js
describe('Spawn weight system', () => {
    test('getSpawnWeights returns correct weights for level 1-3', () => {
        const weights = getSpawnWeights(1);
        expect(weights.clownfish).toBe(0.4);
        expect(weights.anglerfish).toBeUndefined(); // high-level fish not in object
    });

    test('getSpawnWeights returns correct weights for level 4-6', () => {
        const weights = getSpawnWeights(5);
        expect(weights.seahorse).toBeGreaterThan(0);
        expect(weights.clownfish).toBeLessThan(0.4);
    });

    test('getSpawnWeights returns all fish for level 7+', () => {
        const weights = getSpawnWeights(10);
        expect(weights.eel).toBeGreaterThan(0);
        expect(weights.anglerfish).toBeGreaterThan(0);
    });

    test('selectFishByWeight returns valid type', () => {
        const weights = { clownfish: 0.5, shrimp: 0.5 };
        const type = selectFishByWeight(weights);
        expect(['clownfish', 'shrimp']).toContain(type);
    });

    test('all weights sum to 1.0', () => {
        for (let lv = 1; lv <= 15; lv++) {
            const w = getSpawnWeights(lv);
            const sum = Object.values(w).reduce((a, b) => a + b, 0);
            expect(sum).toBeCloseTo(1.0, 2);
        }
    });
});

// Pure helpers
function getSpawnWeights(level) {
    if (level <= 3) return { clownfish: 0.4, shrimp: 0.35, shark: 0.15, jellyfish: 0.1 };
    if (level <= 6) return { clownfish: 0.2, shrimp: 0.2, shark: 0.2, jellyfish: 0.15, seahorse: 0.15, octopus: 0.1 };
    if (level <= 10) return { clownfish: 0.1, shrimp: 0.1, shark: 0.15, anglerfish: 0.15, jellyfish: 0.1, seahorse: 0.15, octopus: 0.15, eel: 0.1 };
    return { shark: 0.2, anglerfish: 0.2, jellyfish: 0.15, seahorse: 0.1, octopus: 0.15, eel: 0.2 };
}

function selectFishByWeight(weights) {
    const validTypes = Object.entries(weights).filter(([, w]) => w > 0).map(([k]) => k);
    const r = Math.random();
    let cumulative = 0;
    for (const [type, weight] of Object.entries(weights)) {
        if (weight === 0) continue;
        cumulative += weight;
        if (r <= cumulative) return type;
    }
    return validTypes[0];
}
