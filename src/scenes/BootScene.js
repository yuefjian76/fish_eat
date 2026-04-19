// BootScene - Loading resources with progress bar
class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222333, 0.8);
        progressBox.fillRect(362, 368, 300, 32);

        const loadingText = this.add.text(512, 340, '加载中...', {
            fontSize: '20px',
            fontFamily: 'Arial',
            color: '#ffffff'
        }).setOrigin(0.5);

        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff88, 1);
            progressBar.fillRect(370, 376, 284 * value, 16);
        });

        // Load background images - theme backgrounds (multiple variations per theme)
        this.load.image('bg_undersea_theme', 'src/assets/images/bg_undersea_theme.jpg');
        this.load.image('background_undersea_theme2', 'src/assets/images/background_undersea_theme2.jpg');
        this.load.image('background_undersea_theme3', 'src/assets/images/background_undersea_theme3.jpg');
        this.load.image('bg_tropical_theme', 'src/assets/images/bg_tropical_theme.jpg');
        this.load.image('background_tropical_theme', 'src/assets/images/background_tropical_theme.jpg');
        this.load.image('background_tropical_theme3', 'src/assets/images/background_tropical_theme3.jpg');
        this.load.image('bg_polar_theme', 'src/assets/images/bg_polar_theme.jpg');
        this.load.image('background_polar_theme2', 'src/assets/images/background_polar_theme2.jpg');
        this.load.image('background_polar_theme3', 'src/assets/images/background_polar_theme3.jpg');
        // Load parallax layer images - theme-specific midground and foreground
        this.load.image('midground_undersea_theme', 'src/assets/images/midground_undersea_theme.jpg');
        this.load.image('midground_tropical_theme', 'src/assets/images/midground_tropical_theme.jpg');
        this.load.image('midground_polar_theme', 'src/assets/images/midground_polar_theme.jpg');
        this.load.image('foreground_undersea_theme', 'src/assets/images/foreground_undersea_theme.jpg');
        this.load.image('foreground_tropical_theme', 'src/assets/images/foreground_tropical_theme.jpg');
        this.load.image('foreground_polar_theme', 'src/assets/images/foreground_polar_theme.jpg');
        this.load.image('far', 'src/assets/images/far.png');
        this.load.image('sand', 'src/assets/images/sand.png');
        this.load.image('bubbles', 'src/assets/images/bubbles_fx.png');

        // Load AI-generated frame animations (4 variants × 4 poses each)
        // Clownfish (Player) - 4 variants × 4 poses = 16 frames
        const clownfishPoses = ['a', 'b', 'c', 'd'];
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_clownfish_${v}${pose}`,
                    `src/assets/images/frames/clownfish/transparent_clownfish_00${v}${pose}.png`);
            }
        }

        // Shark - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_shark_${v}${pose}`,
                    `src/assets/images/frames/shark/transparent_shark_00${v}${pose}.png`);
            }
        }

        // Shrimp - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_shrimp_${v}${pose}`,
                    `src/assets/images/frames/shrimp/transparent_shrimp_00${v}${pose}.png`);
            }
        }

        // Jellyfish - 6 variants × 4 poses
        for (let v = 1; v <= 6; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_jellyfish_${v}${pose}`,
                    `src/assets/images/frames/jellyfish/transparent_jellyfish_00${v}${pose}.png`);
            }
        }

        // Anglerfish - 6 variants × 4 poses
        for (let v = 1; v <= 6; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_anglerfish_${v}${pose}`,
                    `src/assets/images/frames/anglerfish/transparent_anglerfish_00${v}${pose}.png`);
            }
        }

        // Seahorse - 6 variants × 4 poses
        for (let v = 1; v <= 6; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_seahorse_${v}${pose}`,
                    `src/assets/images/frames/seahorse/transparent_seahorse_00${v}${pose}.png`);
            }
        }

        // Octopus - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_octopus_${v}${pose}`,
                    `src/assets/images/frames/octopus/transparent_octopus_00${v}${pose}.png`);
            }
        }

        // Eel - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_eel_${v}${pose}`,
                    `src/assets/images/frames/eel/transparent_eel_00${v}${pose}.png`);
            }
        }

        // Mutant Shark - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_mutant_shark_${v}${pose}`,
                    `src/assets/images/frames/mutant_shark/transparent_mutant_shark_00${v}${pose}.png`);
            }
        }

        // Giant Jellyfish - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_giant_jellyfish_${v}${pose}`,
                    `src/assets/images/frames/giant_jellyfish/transparent_giant_jellyfish_00${v}${pose}.png`);
            }
        }

        // Shark King - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_shark_king_${v}${pose}`,
                    `src/assets/images/frames/shark_king/transparent_shark_king_00${v}${pose}.png`);
            }
        }

        // Boss Squid - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_boss_squid_${v}${pose}`,
                    `src/assets/images/frames/boss_squid/transparent_boss_squid_00${v}${pose}.png`);
            }
        }

        // Boss Sea Dragon - 4 variants × 4 poses
        for (let v = 1; v <= 4; v++) {
            for (const pose of clownfishPoses) {
                this.load.image(`transparent_boss_sea_dragon_${v}${pose}`,
                    `src/assets/images/frames/boss_sea_dragon/transparent_boss_sea_dragon_00${v}${pose}.png`);
            }
        }

        // Legacy frames (fallback)
        this.load.image('player_swim_0', 'src/assets/images/frames/player_swim_0.png');
        this.load.image('player_swim_1', 'src/assets/images/frames/player_swim_1.png');
        this.load.image('player_swim_2', 'src/assets/images/frames/player_swim_2.png');
        this.load.image('player_swim_3', 'src/assets/images/frames/player_swim_3.png');
        this.load.image('player_swim_4', 'src/assets/images/frames/player_swim_4.png');
        this.load.image('player_swim_5', 'src/assets/images/frames/player_swim_5.png');
        this.load.image('player_swim_6', 'src/assets/images/frames/player_swim_6.png');
        this.load.image('enemy_fish_0', 'src/assets/images/frames/enemy_fish_0.png');
        this.load.image('enemy_fish_1', 'src/assets/images/frames/enemy_fish_1.png');
        this.load.image('enemy_fish_2', 'src/assets/images/frames/enemy_fish_2.png');
        this.load.image('enemy_fish_3', 'src/assets/images/frames/enemy_fish_3.png');
        this.load.image('enemy_fish_big_0', 'src/assets/images/frames/enemy_fish_big_0.png');
        this.load.image('enemy_fish_big_1', 'src/assets/images/frames/enemy_fish_big_1.png');
        this.load.image('enemy_fish_big_2', 'src/assets/images/frames/enemy_fish_big_2.png');
        this.load.image('enemy_fish_big_3', 'src/assets/images/frames/enemy_fish_big_3.png');
        this.load.image('enemy_fish_big_4', 'src/assets/images/frames/enemy_fish_big_4.png');
    }

    create() {
        this.createFishAnimations();
        this.scene.start('MenuScene');
    }

    /**
     * Create Phaser animations for all fish types.
     * Each fish has 4 variants, each variant has 4 poses (a,b,c,d).
     * Creates separate animations per variant (variant_1, variant_2, variant_3, variant_4).
     */
    createFishAnimations() {
        const poses = ['a', 'b', 'c', 'd'];
        const frameRates = {
            clownfish: 4, shark: 4, shrimp: 4, jellyfish: 3,
            anglerfish: 3, seahorse: 3, octopus: 4, eel: 5,
            mutant_shark: 4, giant_jellyfish: 3, shark_king: 4,
            boss_squid: 3, boss_sea_dragon: 4
        };
        // Variants per fish type (most have 4, some have 6)
        const variantCounts = {
            clownfish: 4, shark: 4, shrimp: 4, jellyfish: 6,
            anglerfish: 6, seahorse: 6, octopus: 4, eel: 4,
            mutant_shark: 4, giant_jellyfish: 4, shark_king: 4,
            boss_squid: 4, boss_sea_dragon: 4
        };

        // Create animations for each fish type
        const fishTypes = Object.keys(frameRates);

        for (const fishType of fishTypes) {
            const frameRate = frameRates[fishType];
            const variantCount = variantCounts[fishType];
            // Create animations, one per variant
            for (let variant = 1; variant <= variantCount; variant++) {
                const frames = poses.map(pose =>
                    ({ key: `transparent_${fishType}_${variant}${pose}`, frame: null })
                );
                this.anims.create({
                    key: `${fishType}_swim_${variant}`,
                    frames: frames,
                    frameRate: frameRate,
                    repeat: -1
                });
            }
        }

        // Legacy player spritesheet
        this.anims.create({
            key: 'player_swim',
            frames: this.anims.generateFrameNumbers('player_swim', { start: 0, end: 6 }),
            frameRate: 8,
            repeat: -1
        });
    }
}

export default BootScene;
