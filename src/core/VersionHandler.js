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
        TH: { name: "Theodotion", value: "LXX-Th", abbreviation: "th" },
    }

    /**
     * Normalizes version string
     * @param {string} version - Version string
     * @returns {string} Normalized version
     */
    static normalizeVersion(version) {
        if (!version) return "eng"
        const lowerVersion = version.toLowerCase()
        if (lowerVersion === "bhs") return "mt"
        if (lowerVersion === "lxx-th" || lowerVersion === "th") return "th"
        return lowerVersion
    }

    /**
     * Gets version object for a given version and testament
     * @param {string} version - Version abbreviation
     * @param {string} testament - Testament (old/new)
     * @returns {Object} Version object
     */
    static getVersion(version, testament) {
        const normalized = VersionHandler.normalizeVersion(version)

        if (testament === "old") {
            if (normalized === "lxx") return VersionHandler.VERSIONS.LXX
            if (normalized === "mt") return VersionHandler.VERSIONS.MT
            if (normalized === "th") return VersionHandler.VERSIONS.TH
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
        return ["eng", "lxx", "mt", "th"].includes(normalized)
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
            case "th":
                return VersionHandler.VERSIONS.TH
            case "eng":
            default:
                return VersionHandler.VERSIONS.ENG
        }
    }
}

module.exports = VersionHandler
