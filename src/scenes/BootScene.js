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
        // Clownfish (Player) - 6 frames (key pattern: baseKey_N.jpg)
        this.load.image('clownfish_swim_1', 'src/assets/images/frames/clownfish/clownfish_swim_1.jpg');
        this.load.image('clownfish_swim_2', 'src/assets/images/frames/clownfish/clownfish_swim_2.jpg');
        this.load.image('clownfish_swim_3', 'src/assets/images/frames/clownfish/clownfish_swim_3.jpg');
        this.load.image('clownfish_swim_4', 'src/assets/images/frames/clownfish/clownfish_swim_4.jpg');
        this.load.image('clownfish_swim_5', 'src/assets/images/frames/clownfish/clownfish_swim_5.jpg');
        this.load.image('clownfish_swim_6', 'src/assets/images/frames/clownfish/clownfish_swim_6.jpg');

        // Shark - 4 frames (key pattern: baseKey_N_001.jpg)
        this.load.image('shark_anim_1_001', 'src/assets/images/frames/shark/shark_anim_1_001.jpg');
        this.load.image('shark_anim_2_001', 'src/assets/images/frames/shark/shark_anim_2_001.jpg');
        this.load.image('shark_anim_3_001', 'src/assets/images/frames/shark/shark_anim_3_001.jpg');
        this.load.image('shark_anim_4_001', 'src/assets/images/frames/shark/shark_anim_4_001.jpg');

        // Shrimp - 4 frames
        this.load.image('shrimp_anim_1_001', 'src/assets/images/frames/shrimp/shrimp_anim_1_001.jpg');
        this.load.image('shrimp_anim_2_001', 'src/assets/images/frames/shrimp/shrimp_anim_2_001.jpg');
        this.load.image('shrimp_anim_3_001', 'src/assets/images/frames/shrimp/shrimp_anim_3_001.jpg');
        this.load.image('shrimp_anim_4_001', 'src/assets/images/frames/shrimp/shrimp_anim_4_001.jpg');

        // Jellyfish - 4 frames (key pattern: jellyfish_swim_N_001.jpg)
        this.load.image('jellyfish_swim_1_001', 'src/assets/images/frames/jellyfish/jellyfish_swim_1_001.jpg');
        this.load.image('jellyfish_swim_2_001', 'src/assets/images/frames/jellyfish/jellyfish_swim_2_001.jpg');
        this.load.image('jellyfish_swim_3_001', 'src/assets/images/frames/jellyfish/jellyfish_swim_3_001.jpg');
        this.load.image('jellyfish_swim_4_001', 'src/assets/images/frames/jellyfish/jellyfish_swim_4_001.jpg');

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
        this.scene.start('MenuScene');
    }
}

export default BootScene;
