# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

### Removed
- Unused dependencies left over from the Vue app: `register-service-worker`, `@vue/cli-plugin-pwa`, `webpack`, `webpack-cli` and `lite-server`.

## [0.4.4] - 2023-05-07

### Fixed
- A misplaced parenthesis that caused a bug when parsing a few ROMs.

[Unreleased]: https://github.com/permartinson/wpcedit.js/compare/2795709...HEAD
