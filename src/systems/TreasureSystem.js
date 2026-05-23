/**
 * TreasureSystem - Treasure box collision handling
 *
 * Handles treasure box collection with reward distribution.
 *
 * Usage:
 *   const treasureSystem = new TreasureSystem({
 *     onCollect: (box, reward) => { ... }  // callback for side effects
 *   });
 */
export class TreasureSystem {
    /**
     * @param {object} config - Configuration object
     * @param {function} config.onCollect - Callback when treasure is collected (box, reward)
     */
    constructor(config) {
        this.onCollect = config.onCollect || (() => {});
        this._collectedCount = 0;
    }

    /**
     * Check collect collision between player and treasure box
     * @param {object} player - Player object
     * @param {object} treasureBoxGraphics - Treasure box graphics object
     * @returns {object|null} Collected reward or null
     */
    checkCollect(player, treasureBoxGraphics) {
        const treasureBoxData = treasureBoxGraphics.treasureBoxData;

        if (!treasureBoxData || treasureBoxData.isCollected) {
            return null;
        }

        const reward = treasureBoxData.collect(player);
        if (reward) {
            this._collectedCount++;
            this.onCollect(treasureBoxGraphics, reward);
        }
        return reward;
    }

    /**
     * Get collected count
     * @returns {number} Number of treasures collected
     */
    getCollectedCount() {
        return this._collectedCount;
    }

    /**
     * Reset treasure system
     */
    reset() {
        this._collectedCount = 0;
    }
}

export default TreasureSystem;