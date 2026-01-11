/**
 * VersionHandler.js
 * Handles Bible version management and conversions
 */

/**
 * Handles Bible version operations
 */
class VersionHandler {
    static VERSIONS = {
        ENG: { name: "English", value: "ENG", abbreviation: "eng" },
        LXX: { name: "Septuagint", value: "LXX", abbreviation: "lxx" },
        MT: { name: "Masoretic Text", value: "MT", abbreviation: "mt" },
        BHS: { name: "Masoretic Text", value: "MT", abbreviation: "mt" }, // BHS is alias for MT
    }

    /**
     * Normalizes version string
     * @param {string} version - Version string
     * @returns {string} Normalized version
     */
    static normalizeVersion(version) {
        if (!version) return "eng"
        const lowerVersion = version.toLowerCase()
        return lowerVersion === "bhs" ? "mt" : lowerVersion
    }

    /**
     * Gets version object for a given version and testament
     * @param {string} version - Version abbreviation
     * @param {string} testament - Testament (old/new)
     * @returns {Object} Version object
     */
    static getVersion(version, testament) {
        const effectiveVersion = version || "eng"
        const lowerVersion = effectiveVersion.toLowerCase()

        if (lowerVersion === "lxx" && testament === "old") {
            return VersionHandler.VERSIONS.LXX
        }
        if ((lowerVersion === "mt" || lowerVersion === "bhs") && testament === "old") {
            return VersionHandler.VERSIONS.MT
        }
        return VersionHandler.VERSIONS.ENG
    }

    /**
     * Validates version string
     * @param {string} version - Version to validate
     * @returns {boolean} True if valid
     */
    static isValidVersion(version) {
        const normalized = VersionHandler.normalizeVersion(version)
        return ["eng", "lxx", "mt"].includes(normalized)
    }

    /**
     * Gets version object from abbreviation
     * @param {string} abbr - Version abbreviation
     * @returns {Object} Version object
     */
    static getVersionObject(abbr) {
        const normalized = VersionHandler.normalizeVersion(abbr)

        switch (normalized) {
            case "lxx":
                return VersionHandler.VERSIONS.LXX
            case "mt":
                return VersionHandler.VERSIONS.MT
            case "eng":
            default:
                return VersionHandler.VERSIONS.ENG
        }
    }
}

module.exports = VersionHandler
