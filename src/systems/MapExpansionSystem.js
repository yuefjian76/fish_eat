/**
 * MapExpansionSystem - World coordinate tracking and zone calculation
 * Core responsibilities:
 * - Track player world coordinates (worldX, worldY)
 * - Calculate current theme zone
 * - Manage background image dynamic loading and switching
 * - Trigger theme transition animations
 */
export class MapExpansionSystem {
    /**
     * @param {object} zonesData - Zone configuration data from zones.json
     */
    constructor(zonesData) {
        /** @type {number} Player world X coordinate */
        this.worldX = 0;

        /** @type {number} Player world Y coordinate */
        this.worldY = 0;

        /** @type {Array} Zone configuration array */
        this.zones = zonesData.zones || [];

        /** @type {object|null} Callback for zone transitions (newZone, oldZone) */
        this.onZoneTransition = null;

        /** @type {string} ID of the current zone */
        this.currentZoneId = this._computeCurrentZoneId(0);

        /** @type {object|null} Reference to background system for transitions */
        this.backgroundSystem = null;
    }

    /**
     * Update player position and check for zone transitions
     * @param {number} x - World X coordinate
     * @param {number} y - World Y coordinate
     */
    updatePlayerPosition(x, y) {
        const oldZoneId = this.currentZoneId;

        this.worldX = x;
        this.worldY = y;

        const newZoneId = this._computeCurrentZoneId(this.getDistanceFromOrigin());

        if (newZoneId !== oldZoneId) {
            this.currentZoneId = newZoneId;

            if (this.onZoneTransition) {
                const oldZone = this.getZoneById(oldZoneId);
                const newZone = this.getZoneById(newZoneId);
                this.onZoneTransition(newZone, oldZone);
            }
        }
    }

    /**
     * Get current zone based on player position
     * @returns {object} Current zone configuration
     */
    getCurrentZone() {
        return this.getZoneById(this.currentZoneId);
    }

    /**
     * Calculate distance from origin (0, 0) using Euclidean distance
     * @returns {number} Distance from origin
     */
    getDistanceFromOrigin() {
        return Math.sqrt(this.worldX * this.worldX + this.worldY * this.worldY);
    }

    /**
     * Get enemy level range for the current zone
     * @returns {Array} [minLevel, maxLevel]
     */
    getEnemyLevelRange() {
        const zone = this.getCurrentZone();
        return zone ? zone.enemyLevelRange : [1, 3];
    }

    /**
     * Get zone configuration by ID
     * @param {string} zoneId - Zone identifier
     * @returns {object|null} Zone configuration or null if not found
     */
    getZoneById(zoneId) {
        return this.zones.find(z => z.id === zoneId) || null;
    }

    /**
     * Set callback for zone transition events
     * @param {function} callback - Function(newZone, oldZone)
     */
    setZoneTransitionCallback(callback) {
        this.onZoneTransition = callback;
    }

    /**
     * Reset system to initial state
     */
    reset() {
        this.worldX = 0;
        this.worldY = 0;
        this.currentZoneId = 'shallow';
    }

    /**
     * Get tint color for current zone
     * @returns {number} RGB tint color
     */
    getZoneTint() {
        const zone = this.getCurrentZone();
        return zone ? zone.tint : 16777215;
    }

    /**
     * Get bubble color for current zone
     * @returns {number} RGB bubble color
     */
    getZoneBubbleColor() {
        const zone = this.getCurrentZone();
        return zone ? zone.bubbleColor : 11445693;
    }

    /**
     * Get background images for current zone
     * @returns {Array} Array of background image keys
     */
    getZoneBackgrounds() {
        const zone = this.getCurrentZone();
        return zone ? zone.backgrounds : [];
    }

    /**
     * Get midground images for current zone
     * @returns {Array} Array of midground image keys
     */
    getZoneMidgrounds() {
        const zone = this.getCurrentZone();
        return zone ? zone.midgrounds : [];
    }

    /**
     * Check if current zone has a boss
     * @returns {boolean}
     */
    hasBoss() {
        const zone = this.getCurrentZone();
        return zone && zone.bossType !== null;
    }

    /**
     * Get boss type for current zone
     * @returns {string|null} Boss type identifier
     */
    getBossType() {
        const zone = this.getCurrentZone();
        return zone ? zone.bossType : null;
    }

    /**
     * Compute zone ID based on distance from origin
     * @param {number} distance - Distance from origin
     * @returns {string} Zone ID
     * @private
     */
    _computeCurrentZoneId(distance) {
        for (const zone of this.zones) {
            if (distance >= zone.minDistance && distance < zone.maxDistance) {
                return zone.id;
            }
        }
        // Default to last zone if beyond all defined zones
        return this.zones.length > 0 ? this.zones[this.zones.length - 1].id : 'shallow';
    }
}

export default MapExpansionSystem;
