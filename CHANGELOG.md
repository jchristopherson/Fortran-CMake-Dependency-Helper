# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.2] - 2026-08-16

### Added
- Added extension logo assets and package icon configuration.
- Repository documentation set covering architecture, usage, and development workflows.
- Contribution guide with setup and pull request expectations.
- Build status badge in the README.

### Changed
- Improved README organization with a clearer onboarding flow and interface screenshots.

## [0.0.1] - 2026-08-16

### Added
- VS Code extension scaffolding for Fortran/CMake dependency management.
- Project initialization command for creating a basic CMake project.
- Dependency add workflow with metadata storage in `.vscode/fortran-deps.json`.
- Automatic generation of `cmake/dependencies.cmake`.
- Automatic insertion of `target_link_libraries` into the primary `CMakeLists.txt`.
- Validation command that runs CMake configure/build for dependency checks.
- Tree view with per-dependency status icons.
- Webview-based dependency manager UI.

### Fixed
- Dependency status parsing for package names and alias cases.
- Correct handling of fallback logic for `find_package` and `FetchContent`.
- CMake generation cleanup to remove stale link entries before regenerating them.
