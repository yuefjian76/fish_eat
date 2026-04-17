// src/systems/__tests__/SizeHint.test.js
describe('Size hint (glow) system', () => {
    test('getGlowColor returns green for edible fish', () => {
        expect(getGlowColor(30, 20)).toBe(0x00ff44); // player 30, fish 20 (player > fish*1.2)
    });

    test('getGlowColor returns red for dangerous fish', () => {
        expect(getGlowColor(20, 30)).toBe(0xff3333); // player 20, fish 30 (fish > player*1.2)
    });

    test('getGlowColor returns null for similar size', () => {
        expect(getGlowColor(25, 24)).toBeNull(); // similar size, no hint
    });

    test('getGlowColor returns null when fish is strong against player', () => {
        expect(getGlowColor(30, 20, true)).toBeNull(); // fish is strong against player
    });

    test('glow radius proportional to fish size', () => {
        expect(getGlowRadius(20)).toBe(22);
        expect(getGlowRadius(50)).toBe(52);
    });
});

function getGlowColor(playerSize, fishSize, fishIsStrongAgainstPlayer = false) {
    if (fishIsStrongAgainstPlayer) return null;
    if (playerSize > fishSize * 1.2) return 0x00ff44;
    if (fishSize > playerSize * 1.2) return 0xff3333;
    return null;
}

function getGlowRadius(fishSize) {
    return fishSize + 2;
}
