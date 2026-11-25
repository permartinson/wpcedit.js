# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.5.0] - 2026-11-25

### Added
- Facit tests (`npm test`) that decode every font glyph and full frame image in a set of ROM files and compare them with saved fingerprints in `tests/facit/`. ROM files are read from `./roms` or the folder in `WPCEDIT_ROMS` and are never committed.
- Type declarations (`.d.ts`) are now included in the package.
- ESLint setup (`npm run lint`) with a naming convention rule (camelCase for variables and functions, PascalCase for types). It only warns for now, while the old names are being renamed.
- `typecheck`, `lint`, `test` and `test:update` scripts.
- This changelog.

### Changed
- TypeScript (4.9.5) is now a declared dev dependency instead of relying on a globally installed version.
- `tsconfig.json` now sets `module`, `moduleResolution` and `rootDir` explicitly and only compiles `src/`. The generated JavaScript is byte-for-byte identical to before.
- `package.json` declares `"type": "module"`, `types`, `files` and the correct repository URL.
- Font glyphs are decoded once instead of twice each time `variableSizedImage.plane` or `getImageAt()` is read. Output unchanged.

### Removed
- Unused dependencies left over from the Vue app: `register-service-worker`, `@vue/cli-plugin-pwa`, `webpack`, `webpack-cli` and `lite-server`.

### Fixed
- Table pointer parsing read the WPC address and page byte from the wrong ROM offset (`byteAtAddr(ptr & 0xff)` instead of `byteAtAddr(ptr) & 0xff`), and a misplaced parenthesis kept only the low byte of the address. The graphics table could be missed on ROMs where the font table pointer is in non-banked ROM. No change for the 11 test ROMs.
- `preAnalyzeVariableSizedImageTable()` checked `minTableIndex` instead of `minImageIndex` for an error from `getFirstImageIndex()`. No change in output.
- `extractWPCAddrAndPageOfImageTable()` validated the current table index instead of the `TableIndex` argument. No change in output.
- A new decoded plane let the image, mask and XOR buffers share one `Uint8Array`, so writing to one would change the others. Each buffer now has its own array. No change in output.
- The animation table lookup used a ROM byte as if it were an address. It now follows the pointer like the original WPC Edit. The animation table is not used by the library yet.

## [0.4.4] - 2023-05-07

### Fixed
- A misplaced parenthesis that caused a bug when parsing a few ROMs.

[Unreleased]: https://github.com/permartinson/wpcedit.js/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/permartinson/wpcedit.js/compare/2795709...v0.5.0
