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

        // Load background images
        this.load.image('bg_undersea', 'src/assets/images/background_undersea.png');
        this.load.image('midground', 'src/assets/images/midground_undersea.png');
        this.load.image('foreground', 'src/assets/images/foregound-merged.png');
        this.load.image('far', 'src/assets/images/far.png');
        this.load.image('sand', 'src/assets/images/sand.png');
        this.load.image('bubbles', 'src/assets/images/bubbles_fx.png');

        // Load single-frame entity sprites (cropped from sprite sheets)
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
