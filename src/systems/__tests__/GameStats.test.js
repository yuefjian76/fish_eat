// GameStats.test.js - Tests for game statistics tracking and persistence

describe('GameStats - statistics tracking', () => {
    let stats;

    beforeEach(() => {
        stats = createGameStats();
    });

    describe('initialization', () => {
        test('starts with zero kills', () => {
            expect(stats.kills).toBe(0);
        });

        test('starts with zero survival time', () => {
            expect(stats.survivalTime).toBe(0);
        });

        test('starts with zero score', () => {
            expect(stats.score).toBe(0);
        });
    });

    describe('kill tracking', () => {
        test('increment kills', () => {
            stats.addKill();
            stats.addKill();
            expect(stats.kills).toBe(2);
        });
    });

    describe('survival time', () => {
        test('format seconds to mm:ss', () => {
            expect(formatTime(90)).toBe('1:30');
        });

        test('format seconds under a minute', () => {
            expect(formatTime(45)).toBe('0:45');
        });

        test('format large time', () => {
            expect(formatTime(3661)).toBe('61:01');
        });

        test('format zero', () => {
            expect(formatTime(0)).toBe('0:00');
        });
    });

    describe('high score persistence', () => {
        test('saves high score when current score is higher', () => {
            const storage = createMockStorage();
            const highScore = getHighScore(storage, 'fishEat_highScore');
            expect(highScore).toBe(0);

            saveHighScore(storage, 'fishEat_highScore', 1000);
            expect(getHighScore(storage, 'fishEat_highScore')).toBe(1000);
        });

        test('does not overwrite higher existing score', () => {
            const storage = createMockStorage();
            saveHighScore(storage, 'fishEat_highScore', 2000);
            saveHighScore(storage, 'fishEat_highScore', 1000); // lower
            expect(getHighScore(storage, 'fishEat_highScore')).toBe(2000);
        });

        test('saves new high score when higher', () => {
            const storage = createMockStorage();
            saveHighScore(storage, 'fishEat_highScore', 1000);
            saveHighScore(storage, 'fishEat_highScore', 3000); // higher
            expect(getHighScore(storage, 'fishEat_highScore')).toBe(3000);
        });
    });

    describe('highest level persistence', () => {
        test('saves highest level', () => {
            const storage = createMockStorage();
            saveHighestLevel(storage, 5);
            expect(getHighestLevel(storage)).toBe(5);
        });

        test('does not overwrite higher existing level', () => {
            const storage = createMockStorage();
            saveHighestLevel(storage, 10);
            saveHighestLevel(storage, 5);
            expect(getHighestLevel(storage)).toBe(10);
        });
    });

    describe('isNewRecord', () => {
        test('returns true when score is new record', () => {
            const storage = createMockStorage();
            saveHighScore(storage, 'fishEat_highScore', 500);
            expect(isNewRecord(storage, 'fishEat_highScore', 1000)).toBe(true);
        });

        test('returns false when score is not a record', () => {
            const storage = createMockStorage();
            saveHighScore(storage, 'fishEat_highScore', 1000);
            expect(isNewRecord(storage, 'fishEat_highScore', 500)).toBe(false);
        });
    });
});

// ─── Pure helpers ─────────────────────────────────────────────────────────

function createGameStats() {
    return { kills: 0, survivalTime: 0, score: 0, addKill() { this.kills++; } };
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function createMockStorage() {
    const store = {};
    return {
        getItem: (k) => store[k] ?? null,
        setItem: (k, v) => { store[k] = String(v); }
    };
}

function getHighScore(storage, key) {
    const v = storage.getItem(key);
    return v ? parseInt(v) : 0;
}

function saveHighScore(storage, key, score) {
    const current = getHighScore(storage, key);
    if (score > current) storage.setItem(key, score);
}

function getHighestLevel(storage) {
    const v = storage.getItem('fishEat_maxLevel');
    return v ? parseInt(v) : 1;
}

function saveHighestLevel(storage, level) {
    const current = getHighestLevel(storage);
    if (level > current) storage.setItem('fishEat_maxLevel', level);
}

function isNewRecord(storage, key, score) {
    return score > getHighScore(storage, key);
}
