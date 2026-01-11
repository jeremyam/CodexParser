# Changelog

All notable changes to this project are documented here. For full details, see the Release Notes in README and the GitHub Releases page.

## 0.2.0 — 2026-01-10

- Refactored internal architecture into clear folders:
  - `src/core` (parser, scanner, validator, collection, version/versification handlers)
  - `src/utils` (helpers, regex, chapter-verse data loader)
  - `src/format` (OSIS formatter, abbreviations)
  - `src/data` (bible lists, chapter_verses, versifications, sbl abbreviations)
- Adopted OSIS textual hashes (e.g., `John.3.16`, `Rev.1.8-Rev.2.17`).
- Added numeric OSIS using pythonbible-style integer verse IDs (`book*1_000_000 + chapter*1_000 + verse`).
- Attached per-passage version helpers: `getVersion()`, `getLXX()`, `getMT()`, `getBHS()`, `getEnglish()`.
- Cleaned dependencies and removed vulnerable toolchain; `npm audit` is clean.
- Published to npm as `codexparser@0.2.0`.

See the release: https://github.com/jeremyam/CodexParser/releases/tag/v0.2.0
