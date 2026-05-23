import { jest } from '@jest/globals';
import ShopSystem from '../ShopSystem.js';

describe('ShopSystem', () => {
    let shopSystem;
    let localStorageMock;

    const MOCK_UPGRADES = {
        starting_hp: {
            name: '初始生命',
            description: '游戏开始时增加最大生命值',
            maxLevel: 10,
            costPerLevel: 100,
            effect: { type: 'max_hp_bonus', value: 20 }
        },
        starting_speed: {
            name: '初始速度',
            description: '提升基础移动速度',
            maxLevel: 5,
            costPerLevel: 80,
            effect: { type: 'speed_bonus', value: 15 }
        },
        damage_boost: {
            name: '伤害增强',
            description: '增加撕咬技能的伤害',
            maxLevel: 10,
            costPerLevel: 120,
            effect: { type: 'damage_bonus', value: 5 }
        },
        hp_regen: {
            name: '生命恢复',
            description: '每秒恢复少量生命值',
            maxLevel: 5,
            costPerLevel: 150,
            effect: { type: 'hp_regen', value: 1 }
        },
        exp_boost: {
            name: '经验加成',
            description: '获得额外经验值',
            maxLevel: 10,
            costPerLevel: 100,
            effect: { type: 'exp_bonus', value: 0.1 }
        },
        luck_boost: {
            name: '幸运提升',
            description: '增加漂流瓶和宝箱的好运效果',
            maxLevel: 5,
            costPerLevel: 200,
            effect: { type: 'luck_bonus', value: 0.1 }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock = {
            data: {},
            getItem(key) { return this.data[key] || null; },
            setItem(key, value) { this.data[key] = value; },
            removeItem(key) { delete this.data[key]; },
            clear() { this.data = {}; }
        };
        global.localStorage = localStorageMock;
        shopSystem = new ShopSystem(MOCK_UPGRADES);
    });

    afterEach(() => {
        delete global.localStorage;
    });

    describe('constructor', () => {
        it('should initialize with upgrades data', () => {
            expect(shopSystem.upgradesData).toEqual(MOCK_UPGRADES);
        });

        it('should initialize with empty upgrade levels', () => {
            expect(shopSystem.upgradeLevels).toEqual({});
        });
    });

    describe('loadFromStorage', () => {
        it('should load upgrade levels from localStorage', () => {
            localStorage.setItem('fishEat_upgrades', JSON.stringify({ starting_hp: 3, starting_speed: 1 }));
            shopSystem.loadFromStorage();
            expect(shopSystem.upgradeLevels).toEqual({ starting_hp: 3, starting_speed: 1 });
        });

        it('should initialize with empty object if no data exists', () => {
            shopSystem.loadFromStorage();
            expect(shopSystem.upgradeLevels).toEqual({});
        });

        it('should handle invalid JSON gracefully', () => {
            localStorage.setItem('fishEat_upgrades', 'invalid json');
            shopSystem.loadFromStorage();
            expect(shopSystem.upgradeLevels).toEqual({});
        });
    });

    describe('saveToStorage', () => {
        it('should save upgrade levels to localStorage', () => {
            shopSystem.upgradeLevels = { starting_hp: 5, damage_boost: 2 };
            shopSystem.saveToStorage();
            expect(JSON.parse(localStorage.getItem('fishEat_upgrades'))).toEqual({ starting_hp: 5, damage_boost: 2 });
        });
    });

    describe('getCurrency', () => {
        it('should return currency from localStorage', () => {
            localStorage.setItem('fishEat_currency', '500');
            expect(shopSystem.getCurrency()).toBe(500);
        });

        it('should return 0 if no currency stored', () => {
            expect(shopSystem.getCurrency()).toBe(0);
        });
    });

    describe('setCurrency', () => {
        it('should save currency to localStorage', () => {
            shopSystem.setCurrency(1000);
            expect(localStorage.getItem('fishEat_currency')).toBe('1000');
        });
    });

    describe('addCurrency', () => {
        it('should add currency to existing amount', () => {
            localStorage.setItem('fishEat_currency', '200');
            shopSystem.addCurrency(100);
            expect(shopSystem.getCurrency()).toBe(300);
        });
    });

    describe('canAfford', () => {
        it('should return true if player can afford upgrade', () => {
            localStorage.setItem('fishEat_currency', '500');
            expect(shopSystem.canAfford('starting_hp')).toBe(true);
        });

        it('should return false if player cannot afford upgrade', () => {
            localStorage.setItem('fishEat_currency', '50');
            expect(shopSystem.canAfford('starting_hp')).toBe(false);
        });

        it('should return false if upgrade is maxed', () => {
            localStorage.setItem('fishEat_currency', '10000');
            shopSystem.upgradeLevels = { starting_hp: 10 };
            expect(shopSystem.canAfford('starting_hp')).toBe(false);
        });

        it('should return false for non-existent upgrade', () => {
            localStorage.setItem('fishEat_currency', '10000');
            expect(shopSystem.canAfford('nonexistent')).toBe(false);
        });
    });

    describe('getUpgradeCost', () => {
        it('should return correct cost for next level', () => {
            shopSystem.upgradeLevels = { starting_hp: 2 };
            // Cost is costPerLevel * (currentLevel + 1) = 100 * 3 = 300
            expect(shopSystem.getUpgradeCost('starting_hp')).toBe(300);
        });

        it('should return 0 if upgrade is maxed', () => {
            shopSystem.upgradeLevels = { starting_hp: 10 };
            expect(shopSystem.getUpgradeCost('starting_hp')).toBe(0);
        });

        it('should return costPerLevel for level 0', () => {
            expect(shopSystem.getUpgradeCost('starting_hp')).toBe(100);
        });
    });

    describe('getUpgradeLevel', () => {
        it('should return current upgrade level', () => {
            shopSystem.upgradeLevels = { starting_hp: 5, damage_boost: 2 };
            expect(shopSystem.getUpgradeLevel('starting_hp')).toBe(5);
            expect(shopSystem.getUpgradeLevel('damage_boost')).toBe(2);
        });

        it('should return 0 for non-purchased upgrades', () => {
            expect(shopSystem.getUpgradeLevel('starting_hp')).toBe(0);
        });
    });

    describe('isMaxed', () => {
        it('should return true if upgrade is at max level', () => {
            shopSystem.upgradeLevels = { starting_hp: 10 };
            expect(shopSystem.isMaxed('starting_hp')).toBe(true);
        });

        it('should return false if upgrade is not maxed', () => {
            shopSystem.upgradeLevels = { starting_hp: 5 };
            expect(shopSystem.isMaxed('starting_hp')).toBe(false);
        });
    });

    describe('purchaseUpgrade', () => {
        it('should deduct currency and increase upgrade level', () => {
            localStorage.setItem('fishEat_currency', '500');
            const result = shopSystem.purchaseUpgrade('starting_hp');

            expect(result).toBe(true);
            expect(shopSystem.upgradeLevels['starting_hp']).toBe(1);
            expect(shopSystem.getCurrency()).toBe(400);
        });

        it('should not purchase if cannot afford', () => {
            localStorage.setItem('fishEat_currency', '50');
            const result = shopSystem.purchaseUpgrade('starting_hp');

            expect(result).toBe(false);
            expect(shopSystem.upgradeLevels['starting_hp']).toBeUndefined();
            expect(shopSystem.getCurrency()).toBe(50);
        });

        it('should not purchase if already maxed', () => {
            localStorage.setItem('fishEat_currency', '10000');
            shopSystem.upgradeLevels = { starting_hp: 10 };
            const result = shopSystem.purchaseUpgrade('starting_hp');

            expect(result).toBe(false);
            expect(shopSystem.getCurrency()).toBe(10000);
        });

        it('should return false for non-existent upgrade', () => {
            localStorage.setItem('fishEat_currency', '10000');
            const result = shopSystem.purchaseUpgrade('nonexistent');
            expect(result).toBe(false);
        });

        it('should apply upgrade effect when purchased', () => {
            localStorage.setItem('fishEat_currency', '500');
            const applyUpgradeSpy = jest.spyOn(shopSystem, 'applyUpgrade');
            shopSystem.purchaseUpgrade('starting_hp');

            expect(applyUpgradeSpy).toHaveBeenCalledWith('starting_hp', 1);
        });
    });

    describe('applyUpgrade', () => {
        it('should return correct effect for max_hp_bonus', () => {
            const effect = shopSystem.applyUpgrade('starting_hp', 3);
            expect(effect).toEqual({ type: 'max_hp_bonus', value: 60 }); // 20 * 3
        });

        it('should return correct effect for speed_bonus', () => {
            const effect = shopSystem.applyUpgrade('starting_speed', 2);
            expect(effect).toEqual({ type: 'speed_bonus', value: 30 }); // 15 * 2
        });

        it('should return correct effect for damage_bonus', () => {
            const effect = shopSystem.applyUpgrade('damage_boost', 4);
            expect(effect).toEqual({ type: 'damage_bonus', value: 20 }); // 5 * 4
        });

        it('should return correct effect for hp_regen', () => {
            const effect = shopSystem.applyUpgrade('hp_regen', 3);
            expect(effect).toEqual({ type: 'hp_regen', value: 3 });
        });

        it('should return correct effect for exp_bonus', () => {
            const effect = shopSystem.applyUpgrade('exp_boost', 5);
            expect(effect).toEqual({ type: 'exp_bonus', value: 0.5 }); // 0.1 * 5
        });

        it('should return correct effect for luck_bonus', () => {
            const effect = shopSystem.applyUpgrade('luck_boost', 3);
            expect(effect.type).toBe('luck_bonus');
            expect(effect.value).toBeCloseTo(0.3);
        });

        it('should return null for non-existent upgrade', () => {
            expect(shopSystem.applyUpgrade('nonexistent', 1)).toBeNull();
        });
    });

    describe('getAllUpgrades', () => {
        it('should return all upgrades with current levels and costs', () => {
            shopSystem.upgradeLevels = { starting_hp: 2, damage_boost: 1 };
            localStorage.setItem('fishEat_currency', '500');

            const upgrades = shopSystem.getAllUpgrades();

            expect(upgrades.length).toBeGreaterThanOrEqual(3);
            expect(upgrades.find(u => u.key === 'starting_hp')).toMatchObject({
                key: 'starting_hp',
                name: '初始生命',
                currentLevel: 2,
                nextCost: 300,
                isMaxed: false,
                canAfford: true
            });
        });

        it('should indicate when upgrade is maxed', () => {
            shopSystem.upgradeLevels = { starting_speed: 5 };
            localStorage.setItem('fishEat_currency', '10000');

            const upgrades = shopSystem.getAllUpgrades();
            const speedUpgrade = upgrades.find(u => u.key === 'starting_speed');

            expect(speedUpgrade.isMaxed).toBe(true);
            expect(speedUpgrade.nextCost).toBe(0);
            expect(speedUpgrade.canAfford).toBe(false);
        });
    });

    describe('resetShop', () => {
        it('should reset all upgrade levels and save', () => {
            shopSystem.upgradeLevels = { starting_hp: 5, damage_boost: 3 };
            localStorage.setItem('fishEat_currency', '1000');

            shopSystem.resetShop();

            expect(shopSystem.upgradeLevels).toEqual({});
            expect(JSON.parse(localStorage.getItem('fishEat_upgrades'))).toEqual({});
        });
    });
});