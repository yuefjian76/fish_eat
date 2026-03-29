// SkillBar - UI component for displaying skill icons and cooldowns
export class SkillBar {
    /**
     * @param {object} scene - Phaser scene
     * @param {object} skillsData - Skills configuration
     * @param {object} skillSystem - SkillSystem instance
     */
    constructor(scene, skillsData, skillSystem) {
        this.scene = scene;
        this.skillsData = skillsData;
        this.skillSystem = skillSystem;
        this.skillSlots = {};
        this.container = null;
    }

    /**
     * Create the skill bar UI
     */
    create() {
        // Create container for skill bar
        this.container = this.scene.add.container(512, 700);
        this.container.setDepth(50);

        // Background bar
        const background = this.scene.add.graphics();
        background.fillStyle(0x000000, 0.5);
        background.fillRoundedRect(-130, -35, 260, 70, 10);
        this.container.add(background);

        // Create skill slots
        const skillIds = ['bite', 'shield', 'speed_up', 'heal'];
        const startX = -90;
        const spacing = 60;

        skillIds.forEach((skillId, index) => {
            const skill = this.skillsData[skillId];
            const x = startX + index * spacing;
            const slot = this.createSkillSlot(skillId, skill, x, 0);
            this.skillSlots[skillId] = slot;
            this.container.add(slot.container);
        });
    }

    /**
     * Create a single skill slot
     * @param {string} skillId - Skill identifier
     * @param {object} skill - Skill configuration
     * @param {number} x - X position
     * @param {number} y - Y position
     * @returns {object} Skill slot object
     */
    createSkillSlot(skillId, skill, x, y) {
        const container = this.scene.add.container(x, y);

        // Skill background circle
        const bg = this.scene.add.graphics();
        bg.fillStyle(0x333333, 0.8);
        bg.fillCircle(0, 0, 25);
        bg.lineStyle(2, 0xffffff, 0.5);
        bg.strokeCircle(0, 0, 25);
        container.add(bg);

        // Skill icon (text representation)
        const iconText = this.getSkillIcon(skillId);
        const icon = this.scene.add.text(0, 0, iconText, {
            fontSize: '18px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        icon.setOrigin(0.5);
        container.add(icon);

        // Key label
        const keyLabel = this.scene.add.text(0, 20, skill.key, {
            fontSize: '12px',
            fontFamily: 'Arial',
            color: '#aaaaaa'
        });
        keyLabel.setOrigin(0.5);
        container.add(keyLabel);

        // Cooldown overlay (darkened)
        const cooldownOverlay = this.scene.add.graphics();
        cooldownOverlay.fillStyle(0x000000, 0.7);
        cooldownOverlay.fillCircle(0, 0, 25);
        cooldownOverlay.setAlpha(0);
        container.add(cooldownOverlay);

        // Cooldown text
        const cooldownText = this.scene.add.text(0, 0, '', {
            fontSize: '16px',
            fontFamily: 'Arial',
            color: '#ffffff'
        });
        cooldownText.setOrigin(0.5);
        container.add(cooldownText);

        return {
            container,
            bg,
            icon,
            keyLabel,
            cooldownOverlay,
            cooldownText,
            skill,
            skillId
        };
    }

    /**
     * Get icon text for skill
     * @param {string} skillId - Skill identifier
     * @returns {string} Icon character
     */
    getSkillIcon(skillId) {
        const icons = {
            'bite': '撕',
            'shield': '盾',
            'speed_up': '速',
            'heal': '治'
        };
        return icons[skillId] || '?';
    }

    /**
     * Update skill bar (cooldowns, active effects)
     */
    update() {
        for (const skillId in this.skillSlots) {
            const slot = this.skillSlots[skillId];
            const cooldownPercent = this.skillSystem.getCooldownPercent(skillId);
            const isActive = this.skillSystem.isActive(skillId);
            const cooldownRemaining = this.skillSystem.getCooldownRemaining(skillId);

            // Update cooldown overlay
            if (cooldownPercent > 0) {
                slot.cooldownOverlay.setAlpha(cooldownPercent);

                // Draw pie slice for cooldown
                slot.cooldownOverlay.clear();
                slot.cooldownOverlay.fillStyle(0x000000, 0.7);

                // Draw arc to show remaining cooldown
                const startAngle = -Math.PI / 2;
                const endAngle = startAngle + (2 * Math.PI * cooldownPercent);
                slot.cooldownOverlay.slice(25, 0, 25, startAngle, endAngle, false);
                slot.cooldownOverlay.fillPath();

                // Show cooldown text
                slot.cooldownText.setText(Math.ceil(cooldownRemaining).toString());
            } else {
                slot.cooldownOverlay.setAlpha(0);
                slot.cooldownText.setText('');
            }

            // Update visual for active effects
            if (isActive) {
                slot.bg.clear();
                slot.bg.fillStyle(0x00aaff, 0.5);
                slot.bg.fillCircle(0, 0, 25);
                slot.bg.lineStyle(2, 0x00ffff, 0.8);
                slot.bg.strokeCircle(0, 0, 25);
            } else if (cooldownPercent <= 0) {
                slot.bg.clear();
                slot.bg.fillStyle(0x333333, 0.8);
                slot.bg.fillCircle(0, 0, 25);
                slot.bg.lineStyle(2, 0xffffff, 0.5);
                slot.bg.strokeCircle(0, 0, 25);
            }
        }
    }

    /**
     * Show skill use feedback
     * @param {string} skillId - Skill identifier
     * @param {boolean} success - Whether skill was used successfully
     */
    showFeedback(skillId, success) {
        const slot = this.skillSlots[skillId];
        if (!slot) return;

        if (success) {
            // Flash green
            slot.bg.clear();
            slot.bg.fillStyle(0x00ff00, 0.6);
            slot.bg.fillCircle(0, 0, 25);
            slot.bg.lineStyle(2, 0x00ff00, 0.8);
            slot.bg.strokeCircle(0, 0, 25);

            this.scene.time.delayedCall(100, () => {
                if (this.skillSlots[skillId]) {
                    this.update(); // Refresh to normal state
                }
            });
        } else {
            // Flash red
            slot.bg.clear();
            slot.bg.fillStyle(0xff0000, 0.6);
            slot.bg.fillCircle(0, 0, 25);
            slot.bg.lineStyle(2, 0xff0000, 0.8);
            slot.bg.strokeCircle(0, 0, 25);

            this.scene.time.delayedCall(100, () => {
                if (this.skillSlots[skillId]) {
                    this.update(); // Refresh to normal state
                }
            });
        }
    }

    /**
     * Destroy the skill bar
     */
    destroy() {
        if (this.container) {
            this.container.destroy();
        }
    }
}

export default SkillBar;
