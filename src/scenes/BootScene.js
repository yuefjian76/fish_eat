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

        // Anglerfish - 4 frames
        this.load.image('anglerfish_swim_1_001', 'src/assets/images/frames/anglerfish/anglerfish_swim_1_001.jpg');
        this.load.image('anglerfish_swim_2_001', 'src/assets/images/frames/anglerfish/anglerfish_swim_2_001.jpg');
        this.load.image('anglerfish_swim_3_001', 'src/assets/images/frames/anglerfish/anglerfish_swim_3_001.jpg');
        this.load.image('anglerfish_swim_4_001', 'src/assets/images/frames/anglerfish/anglerfish_swim_4_001.jpg');

        // Seahorse - 4 frames
        this.load.image('seahorse_swim_1_001', 'src/assets/images/frames/seahorse/seahorse_swim_1_001.jpg');
        this.load.image('seahorse_swim_2_001', 'src/assets/images/frames/seahorse/seahorse_swim_2_001.jpg');
        this.load.image('seahorse_swim_3_001', 'src/assets/images/frames/seahorse/seahorse_swim_3_001.jpg');
        this.load.image('seahorse_swim_4_001', 'src/assets/images/frames/seahorse/seahorse_swim_4_001.jpg');

        // Octopus - 4 frames
        this.load.image('octopus_swim_1_001', 'src/assets/images/frames/octopus/octopus_swim_1_001.jpg');
        this.load.image('octopus_swim_2_001', 'src/assets/images/frames/octopus/octopus_swim_2_001.jpg');
        this.load.image('octopus_swim_3_001', 'src/assets/images/frames/octopus/octopus_swim_3_001.jpg');
        this.load.image('octopus_swim_4_001', 'src/assets/images/frames/octopus/octopus_swim_4_001.jpg');

        // Eel - 4 frames
        this.load.image('eel_swim_1_001', 'src/assets/images/frames/eel/eel_swim_1_001.jpg');
        this.load.image('eel_swim_2_001', 'src/assets/images/frames/eel/eel_swim_2_001.jpg');
        this.load.image('eel_swim_3_001', 'src/assets/images/frames/eel/eel_swim_3_001.jpg');
        this.load.image('eel_swim_4_001', 'src/assets/images/frames/eel/eel_swim_4_001.jpg');

        // Mutant Shark - 4 frames
        this.load.image('mutant_shark_swim_1_001', 'src/assets/images/frames/mutant_shark/mutant_shark_swim_1_001.jpg');
        this.load.image('mutant_shark_swim_2_001', 'src/assets/images/frames/mutant_shark/mutant_shark_swim_2_001.jpg');
        this.load.image('mutant_shark_swim_3_001', 'src/assets/images/frames/mutant_shark/mutant_shark_swim_3_001.jpg');
        this.load.image('mutant_shark_swim_4_001', 'src/assets/images/frames/mutant_shark/mutant_shark_swim_4_001.jpg');

        // Giant Jellyfish - 4 frames
        this.load.image('giant_jellyfish_swim_1_001', 'src/assets/images/frames/giant_jellyfish/giant_jellyfish_swim_1_001.jpg');
        this.load.image('giant_jellyfish_swim_2_001', 'src/assets/images/frames/giant_jellyfish/giant_jellyfish_swim_2_001.jpg');
        this.load.image('giant_jellyfish_swim_3_001', 'src/assets/images/frames/giant_jellyfish/giant_jellyfish_swim_3_001.jpg');
        this.load.image('giant_jellyfish_swim_4_001', 'src/assets/images/frames/giant_jellyfish/giant_jellyfish_swim_4_001.jpg');

        // Shark King - 4 frames
        this.load.image('shark_king_swim_1_001', 'src/assets/images/frames/shark_king/shark_king_swim_1_001.jpg');
        this.load.image('shark_king_swim_2_001', 'src/assets/images/frames/shark_king/shark_king_swim_2_001.jpg');
        this.load.image('shark_king_swim_3_001', 'src/assets/images/frames/shark_king/shark_king_swim_3_001.jpg');
        this.load.image('shark_king_swim_4_001', 'src/assets/images/frames/shark_king/shark_king_swim_4_001.jpg');

        // Boss Squid - 4 frames
        this.load.image('boss_squid_swim_1_001', 'src/assets/images/frames/boss_squid/boss_squid_swim_1_001.jpg');
        this.load.image('boss_squid_swim_2_001', 'src/assets/images/frames/boss_squid/boss_squid_swim_2_001.jpg');
        this.load.image('boss_squid_swim_3_001', 'src/assets/images/frames/boss_squid/boss_squid_swim_3_001.jpg');
        this.load.image('boss_squid_swim_4_001', 'src/assets/images/frames/boss_squid/boss_squid_swim_4_001.jpg');

        // Boss Sea Dragon - 4 frames
        this.load.image('boss_sea_dragon_swim_1_001', 'src/assets/images/frames/boss_sea_dragon/boss_sea_dragon_swim_1_001.jpg');
        this.load.image('boss_sea_dragon_swim_2_001', 'src/assets/images/frames/boss_sea_dragon/boss_sea_dragon_swim_2_001.jpg');
        this.load.image('boss_sea_dragon_swim_3_001', 'src/assets/images/frames/boss_sea_dragon/boss_sea_dragon_swim_3_001.jpg');
        this.load.image('boss_sea_dragon_swim_4_001', 'src/assets/images/frames/boss_sea_dragon/boss_sea_dragon_swim_4_001.jpg');

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

        // Anglerfish - 4 frames
        this.anims.create({
            key: 'anglerfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `anglerfish_swim_${i}_001`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Seahorse - 4 frames
        this.anims.create({
            key: 'seahorse_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `seahorse_swim_${i}_001`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Octopus - 4 frames
        this.anims.create({
            key: 'octopus_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `octopus_swim_${i}_001`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Eel - 4 frames
        this.anims.create({
            key: 'eel_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `eel_swim_${i}_001`, frame: null })),
            frameRate: 10,
            repeat: -1
        });

        // Mutant Shark - 4 frames
        this.anims.create({
            key: 'mutant_shark_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `mutant_shark_swim_${i}_001`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Giant Jellyfish - 4 frames
        this.anims.create({
            key: 'giant_jellyfish_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `giant_jellyfish_swim_${i}_001`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Boss Shark King - 4 frames
        this.anims.create({
            key: 'shark_king_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `shark_king_swim_${i}_001`, frame: null })),
            frameRate: 8,
            repeat: -1
        });

        // Boss Squid - 4 frames
        this.anims.create({
            key: 'boss_squid_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `boss_squid_swim_${i}_001`, frame: null })),
            frameRate: 6,
            repeat: -1
        });

        // Boss Sea Dragon - 4 frames
        this.anims.create({
            key: 'boss_sea_dragon_swim',
            frames: [1, 2, 3, 4].map(i => ({ key: `boss_sea_dragon_swim_${i}_001`, frame: null })),
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
