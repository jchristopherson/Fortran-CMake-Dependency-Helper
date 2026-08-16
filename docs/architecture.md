# Architecture

This repository is a VS Code extension that helps Fortran projects manage CMake dependencies without needing to hand-edit dependency logic.

## Overview

The extension has four main concerns:

- project scaffolding
- dependency metadata management
- generated CMake logic
- validation and status reporting

## Components

### Extension entry point

The activation logic in `src/extension.ts` registers commands for:

- project initialization
- dependency add/edit/remove
- dependency validation
- dependency manager webview access

It also creates and refreshes the tree view that displays dependency status.

### Dependency model

`src/dependencyModel.ts` defines the dependency structure used by the extension:

- name
- repo
- tag
- version
- cmakePackage

This information is persisted to `.vscode/fortran-deps.json`.

### CMake generation

`src/cmakeGenerator.ts` handles generation of the dependency CMake script and the main project link logic.

The generated flow is:

1. try `find_package(<library> ...)`
2. if not found, emit a fallback message
3. use `FetchContent` to pull the dependency
4. create an alias target when the package name differs from the library name
5. add `target_link_libraries` to the primary `CMakeLists.txt`

### Tree view and status reporting

`src/treeView.ts` creates the Explorer tree entries and applies icons for each dependency.

`src/statusParser.ts` converts CMake output into status values:

- found
- fallback
- failed
- unknown

These statuses are then mapped to icons in the tree view.

### Webview UI

`src/webview.ts` renders a lightweight webview table for dependency management. It is used to add rows, remove them, and save the final dependency list.

## Data flow

1. User runs a command to add or update a dependency.
2. The extension writes to `.vscode/fortran-deps.json`.
3. `generateDependenciesCMake` rewrites the generated dependency script.
4. `generateProjectLinkCMake` updates the project `CMakeLists.txt`.
5. Validation runs CMake on the project.
6. Output is parsed into status values.
7. The tree view refreshes and updates each dependency icon.

## Design notes

The extension is intentionally simple and file-driven:

- dependency metadata is stored as JSON
- generated CMake is checked in and recreated when dependencies change
- validation is performed with the actual CMake configure/build steps

This keeps the extension easy to follow and transparent for users who want to inspect the generated project files.
