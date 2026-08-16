# Fortran CMake Dependency Helper

A VSCode extension that:

- Scaffolds a Fortran + CMake project (with `main.f90` entry point).
- Lets you add GitHub-based dependencies by name + URL.
- Uses `find_package` first, then falls back to `FetchContent` if needed.
- Generates and maintains `cmake/dependencies.cmake`.
- Runs CMake to validate dependencies and shows status in a tree view.

## FYI
This is a work in progress.  Expect changes.

## Features

- Project initialization:
  - Command: **Fortran: Initialize CMake Project**
  - Prompts for project name.
  - Creates `CMakeLists.txt`, `src/main.f90`, and `cmake/dependencies.cmake`.

- Dependency management:
  - Command: **Fortran: Add CMake Dependency**
  - Stores metadata in `.vscode/fortran-deps.json`.
  - Regenerates `cmake/dependencies.cmake`.

- Dependency validation:
  - Command: **Fortran: Validate Dependencies (Run CMake)**
  - Runs `cmake -S . -B build` and `cmake --build build`.
  - Parses output to mark dependencies as:
    - ✔ found
    - ↺ fallback
    - ✖ failed
    - ? unknown

- Tree view:
  - View: **Fortran Dependencies** in the Explorer.
  - Context menu:
    - Edit dependency
    - Remove dependency

## Getting started

1. Clone this repo.
2. Run `npm install`.
3. Run `npm run compile`.
4. Press `F5` in VSCode to launch the Extension Development Host.
5. In the new window:
   - Run **Fortran: Initialize CMake Project**.
   - Run **Fortran: Add CMake Dependency**.
   - Run **Fortran: Validate Dependencies (Run CMake)**.

## Notes

- Requires CMake ≥ 3.20 and a Fortran compiler in PATH.
- Dependencies are managed via `.vscode/fortran-deps.json`.
- Do not edit `cmake/dependencies.cmake` manually; use the extension commands instead.
