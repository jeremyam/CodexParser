// Esther chapter:verse counts using the Vulgate / RSV-with-Apocrypha layout,
// which appends the six Greek additions (A-F) as chapters 10:4-16:24.
// Hebrew Esther runs through 10:3; verses 10:4 onward are deuterocanonical
// (LXX-only). Note: this changes validation - "Esther 11:2" will now resolve
// even in eng mode. Canonical-only validation is a higher-level concern.
module.exports = {
    1: Array.from({ length: 22 }, (_, i) => i + 1), // Esther 1 has 22 verses
    2: Array.from({ length: 23 }, (_, i) => i + 1), // Esther 2 has 23 verses
    3: Array.from({ length: 15 }, (_, i) => i + 1), // Esther 3 has 15 verses
    4: Array.from({ length: 17 }, (_, i) => i + 1), // Esther 4 has 17 verses
    5: Array.from({ length: 14 }, (_, i) => i + 1), // Esther 5 has 14 verses
    6: Array.from({ length: 14 }, (_, i) => i + 1), // Esther 6 has 14 verses
    7: Array.from({ length: 10 }, (_, i) => i + 1), // Esther 7 has 10 verses
    8: Array.from({ length: 17 }, (_, i) => i + 1), // Esther 8 has 17 verses
    9: Array.from({ length: 32 }, (_, i) => i + 1), // Esther 9 has 32 verses
    10: Array.from({ length: 13 }, (_, i) => i + 1), // 10:1-3 Hebrew + 10:4-13 Addition F
    11: Array.from({ length: 12 }, (_, i) => i + 1), // 11:1 colophon + 11:2-12 Addition A pt 1
    12: Array.from({ length: 6 }, (_, i) => i + 1), // 12:1-6 Addition A pt 2
    13: Array.from({ length: 18 }, (_, i) => i + 1), // 13:1-7 Add B + 13:8-18 Add C (Mordecai's prayer)
    14: Array.from({ length: 19 }, (_, i) => i + 1), // 14:1-19 Add C (Esther's prayer)
    15: Array.from({ length: 16 }, (_, i) => i + 1), // 15:1-16 Add D (Esther approaches the king)
    16: Array.from({ length: 24 }, (_, i) => i + 1), // 16:1-24 Add E (king's second decree)
}
