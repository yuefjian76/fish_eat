import { FloatingTextSystem } from '../FloatingTextSystem.js';

// Simple mock factory
const createMockScene = () => {
    const texts = [];
    const tweens = [];
    return {
        add: {
            text: (x, y, text, style) => {
                texts.push({ x, y, text, style });
                return {
                    x, y, text, style,
                    setOrigin: () => {},
                    setDepth: () => {}
                };
            }
        },
        tweens: {
            add: (config) => {
                tweens.push(config);
            }
        },
        _texts: texts,
        _tweens: tweens
    };
};

describe('FloatingTextSystem', () => {
    describe('initialization', () => {
        test('creates floating text system', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            expect(ft).toBeDefined();
        });

        test('calls onTextCreated callback', () => {
            const scene = createMockScene();
            const created = [];
            const ft = new FloatingTextSystem({
                scene,
                onTextCreated: (text) => created.push(text)
            });
            ft.showDamage(100, 100, 50);
            expect(created.length).toBe(1);
        });
    });

    describe('showDamage', () => {
        test('shows damage text with correct format', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            ft.showDamage(100, 100, 25);
            expect(scene._texts[0].text).toBe('-25');
        });

        test('adds tween animation', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            ft.showDamage(100, 100, 25);
            expect(scene._tweens.length).toBe(1);
            expect(scene._tweens[0].duration).toBe(800);
        });
    });

    describe('showExp', () => {
        test('shows exp text with correct format', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            ft.showExp(100, 100, 50);
            expect(scene._texts[0].text).toBe('+50');
        });
    });

    describe('show', () => {
        test('shows custom text', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            ft.show(100, 100, 'Hello', { color: 0xff0000 });
            expect(scene._texts[0].text).toBe('Hello');
        });

        test('uses custom style', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            ft.show(100, 100, 'Test', { color: 0x0000ff, fontSize: '24px' });
            expect(scene._texts[0].style.fontSize).toBe('24px');
        });
    });

    describe('reset', () => {
        test('reset does not throw', () => {
            const scene = createMockScene();
            const ft = new FloatingTextSystem({ scene });
            expect(() => ft.reset()).not.toThrow();
        });
    });
});