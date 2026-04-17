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

        // Load AI-generated frame animations
        // Clownfish (Player) - 4 transparent PNG frames
        this.load.image('transparent_clownfish_001', 'src/assets/images/frames/clownfish/transparent_clownfish_001.png');
        this.load.image('transparent_clownfish_002', 'src/assets/images/frames/clownfish/transparent_clownfish_002.png');
        this.load.image('transparent_clownfish_003', 'src/assets/images/frames/clownfish/transparent_clownfish_003.png');
        this.load.image('transparent_clownfish_004', 'src/assets/images/frames/clownfish/transparent_clownfish_004.png');

        // Shark - 4 transparent PNG frames
        this.load.image('transparent_shark_001', 'src/assets/images/frames/shark/transparent_shark_001.png');
        this.load.image('transparent_shark_002', 'src/assets/images/frames/shark/transparent_shark_002.png');
        this.load.image('transparent_shark_003', 'src/assets/images/frames/shark/transparent_shark_003.png');
        this.load.image('transparent_shark_004', 'src/assets/images/frames/shark/transparent_shark_004.png');

        // Shrimp - 4 transparent PNG frames
        this.load.image('transparent_shrimp_001', 'src/assets/images/frames/shrimp/transparent_shrimp_001.png');
        this.load.image('transparent_shrimp_002', 'src/assets/images/frames/shrimp/transparent_shrimp_002.png');
        this.load.image('transparent_shrimp_003', 'src/assets/images/frames/shrimp/transparent_shrimp_003.png');
        this.load.image('transparent_shrimp_004', 'src/assets/images/frames/shrimp/transparent_shrimp_004.png');

        // Jellyfish - 4 transparent PNG frames
        this.load.image('transparent_jellyfish_001', 'src/assets/images/frames/jellyfish/transparent_jellyfish_001.png');
        this.load.image('transparent_jellyfish_002', 'src/assets/images/frames/jellyfish/transparent_jellyfish_002.png');
        this.load.image('transparent_jellyfish_003', 'src/assets/images/frames/jellyfish/transparent_jellyfish_003.png');
        this.load.image('transparent_jellyfish_004', 'src/assets/images/frames/jellyfish/transparent_jellyfish_004.png');

        // Anglerfish - 4 transparent PNG frames
        this.load.image('transparent_anglerfish_001', 'src/assets/images/frames/anglerfish/transparent_anglerfish_001.png');
        this.load.image('transparent_anglerfish_002', 'src/assets/images/frames/anglerfish/transparent_anglerfish_002.png');
        this.load.image('transparent_anglerfish_003', 'src/assets/images/frames/anglerfish/transparent_anglerfish_003.png');
        this.load.image('transparent_anglerfish_004', 'src/assets/images/frames/anglerfish/transparent_anglerfish_004.png');

        // Seahorse - 4 transparent PNG frames
        this.load.image('transparent_seahorse_001', 'src/assets/images/frames/seahorse/transparent_seahorse_001.png');
        this.load.image('transparent_seahorse_002', 'src/assets/images/frames/seahorse/transparent_seahorse_002.png');
        this.load.image('transparent_seahorse_003', 'src/assets/images/frames/seahorse/transparent_seahorse_003.png');
        this.load.image('transparent_seahorse_004', 'src/assets/images/frames/seahorse/transparent_seahorse_004.png');

        // Octopus - 4 transparent PNG frames
        this.load.image('transparent_octopus_001', 'src/assets/images/frames/octopus/transparent_octopus_001.png');
        this.load.image('transparent_octopus_002', 'src/assets/images/frames/octopus/transparent_octopus_002.png');
        this.load.image('transparent_octopus_003', 'src/assets/images/frames/octopus/transparent_octopus_003.png');
        this.load.image('transparent_octopus_004', 'src/assets/images/frames/octopus/transparent_octopus_004.png');

        // Eel - 4 transparent PNG frames
        this.load.image('transparent_eel_001', 'src/assets/images/frames/eel/transparent_eel_001.png');
        this.load.image('transparent_eel_002', 'src/assets/images/frames/eel/transparent_eel_002.png');
        this.load.image('transparent_eel_003', 'src/assets/images/frames/eel/transparent_eel_003.png');
        this.load.image('transparent_eel_004', 'src/assets/images/frames/eel/transparent_eel_004.png');

        // Mutant Shark - 4 transparent PNG frames
        this.load.image('transparent_mutant_shark_001', 'src/assets/images/frames/mutant_shark/transparent_mutant_shark_001.png');
        this.load.image('transparent_mutant_shark_002', 'src/assets/images/frames/mutant_shark/transparent_mutant_shark_002.png');
        this.load.image('transparent_mutant_shark_003', 'src/assets/images/frames/mutant_shark/transparent_mutant_shark_003.png');
        this.load.image('transparent_mutant_shark_004', 'src/assets/images/frames/mutant_shark/transparent_mutant_shark_004.png');

        // Giant Jellyfish - 4 transparent PNG frames
        this.load.image('transparent_giant_jellyfish_001', 'src/assets/images/frames/giant_jellyfish/transparent_giant_jellyfish_001.png');
        this.load.image('transparent_giant_jellyfish_002', 'src/assets/images/frames/giant_jellyfish/transparent_giant_jellyfish_002.png');
        this.load.image('transparent_giant_jellyfish_003', 'src/assets/images/frames/giant_jellyfish/transparent_giant_jellyfish_003.png');
        this.load.image('transparent_giant_jellyfish_004', 'src/assets/images/frames/giant_jellyfish/transparent_giant_jellyfish_004.png');

        // Shark King - 4 transparent PNG frames
        this.load.image('transparent_shark_king_001', 'src/assets/images/frames/shark_king/transparent_shark_king_001.png');
        this.load.image('transparent_shark_king_002', 'src/assets/images/frames/shark_king/transparent_shark_king_002.png');
        this.load.image('transparent_shark_king_003', 'src/assets/images/frames/shark_king/transparent_shark_king_003.png');
        this.load.image('transparent_shark_king_004', 'src/assets/images/frames/shark_king/transparent_shark_king_004.png');

        // Boss Squid - 4 transparent PNG frames
        this.load.image('transparent_boss_squid_001', 'src/assets/images/frames/boss_squid/transparent_boss_squid_001.png');
        this.load.image('transparent_boss_squid_002', 'src/assets/images/frames/boss_squid/transparent_boss_squid_002.png');
        this.load.image('transparent_boss_squid_003', 'src/assets/images/frames/boss_squid/transparent_boss_squid_003.png');
        this.load.image('transparent_boss_squid_004', 'src/assets/images/frames/boss_squid/transparent_boss_squid_004.png');

        // Boss Sea Dragon - 4 transparent PNG frames
        this.load.image('transparent_boss_sea_dragon_001', 'src/assets/images/frames/boss_sea_dragon/transparent_boss_sea_dragon_001.png');
        this.load.image('transparent_boss_sea_dragon_002', 'src/assets/images/frames/boss_sea_dragon/transparent_boss_sea_dragon_002.png');
        this.load.image('transparent_boss_sea_dragon_003', 'src/assets/images/frames/boss_sea_dragon/transparent_boss_sea_dragon_003.png');
        this.load.image('transparent_boss_sea_dragon_004', 'src/assets/images/frames/boss_sea_dragon/transparent_boss_sea_dragon_004.png');

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
     * Create Phaser animations for all fish types from individual frame images.
     */
    createFishAnimations() {
        // Clownfish (player) - 4 transparent PNG frames
        this.anims.create({
            key: 'clownfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_clownfish_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Shark - 4 transparent PNG frames
        this.anims.create({
            key: 'shark_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_shark_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Shrimp - 4 transparent PNG frames
        this.anims.create({
            key: 'shrimp_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_shrimp_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Jellyfish - 4 transparent PNG frames
        this.anims.create({
            key: 'jellyfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_jellyfish_00${i}`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Anglerfish - 4 transparent PNG frames
        this.anims.create({
            key: 'anglerfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_anglerfish_00${i}`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Seahorse - 4 transparent PNG frames
        this.anims.create({
            key: 'seahorse_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_seahorse_00${i}`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Octopus - 4 transparent PNG frames
        this.anims.create({
            key: 'octopus_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_octopus_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Eel - 4 transparent PNG frames
        this.anims.create({
            key: 'eel_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_eel_00${i}`, frame: null })),
            frameRate: 10,
            repeat: -1
        });

        // Mutant Shark - 4 transparent PNG frames
        this.anims.create({
            key: 'mutant_shark_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_mutant_shark_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Giant Jellyfish - 4 transparent PNG frames
        this.anims.create({
            key: 'giant_jellyfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_giant_jellyfish_00${i}`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Boss Shark King - 4 transparent PNG frames
        this.anims.create({
            key: 'shark_king_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_shark_king_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Boss Squid - 4 transparent PNG frames
        this.anims.create({
            key: 'boss_squid_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_boss_squid_00${i}`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Boss Sea Dragon - 4 transparent PNG frames
        this.anims.create({
            key: 'boss_sea_dragon_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `transparent_boss_sea_dragon_00${i}`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

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
