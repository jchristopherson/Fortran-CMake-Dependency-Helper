# Usage Guide

This guide explains the normal workflow for creating a project and managing dependencies with the extension.

## 1. Initialize a project

Run the command:

- Fortran: Initialize CMake Project

You will be prompted for a project name. After that, the extension creates:

- `CMakeLists.txt`
- `src/main.f90`
- `cmake/dependencies.cmake`

## 2. Add dependencies

Run the command:

- Fortran: Add CMake Dependency

Provide:

- a logical dependency name
- the Git repository URL
- a tag or branch (default: `main`)
- the CMake package name, if it differs from the logical name

The dependency is saved to `.vscode/fortran-deps.json` and the generated CMake files are refreshed.

## 3. Open the dependency manager

Run the command:

- Fortran: Open Dependency Manager

This opens the webview for editing the dependency list.

## 4. Validate dependencies

Run the command:

- Fortran: Validate Dependencies (Run CMake)

This runs:

```bash
cmake -S . -B build
cmake --build build
```

The output is parsed and each dependency gets a status:

- found
- fallback
- failed
- unknown

## 5. Inspect the tree view

The tree view in the Explorer shows the dependency list and per-item status icons. This makes it easy to verify whether dependencies were found as installed packages or had to fall back to `FetchContent`.

## 6. Project layout after generation

A typical generated project contains:

```text
project/
├── CMakeLists.txt
├── cmake/
│   └── dependencies.cmake
├── src/
│   └── main.f90
├── .vscode/
│   └── fortran-deps.json
└── build/
```

## Notes

- The generated dependency script is meant to be maintained by the extension.
- If a dependency is added or removed, the project link lines are regenerated automatically.
- CMake must be installed and available on `PATH` for validation to work.
