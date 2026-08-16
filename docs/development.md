# Development Guide

This page provides a quick overview of how to work on the extension in a local development environment.

## Requirements

- Node.js
- npm
- CMake
- a Fortran compiler available on `PATH`
- VS Code for extension debugging

## Local setup

```bash
npm install
npm test
npm run compile
```

## Start the extension in debug mode

1. Open the repository in VS Code.
2. Press `F5`.
3. A new Extension Development Host window opens.
4. Use the extension commands from that host.

## Project structure

```text
src/
├── autoDetect.ts
├── cmakeGenerator.ts
├── dependencyModel.ts
├── extension.ts
├── statusParser.ts
├── treeView.ts
├── webview.ts
└── test/
    ├── cmakeGenerator.test.ts
    └── statusParser.test.ts
templates/
├── CMakeLists.txt
└── main.f90
```

## Key responsibilities

### `src/cmakeGenerator.ts`
Generates the dependency CMake script and updates the project-level `target_link_libraries` calls.

### `src/statusParser.ts`
Parses CMake output to determine whether dependencies are found, fallback, failed, or unknown.

### `src/treeView.ts`
Displays the dependency list in the Explorer tree and attaches status icons.

### `src/webview.ts`
Creates the dependency manager panel shown to the user.

## Validation workflow

When a dependency change is made, the extension should:

1. save dependency metadata
2. regenerate CMake helper files
3. validate with CMake configure/build
4. refresh the tree view status

## Testing

The repository uses Mocha with ts-node for TypeScript tests.

```bash
npm test
```

## Build

```bash
npm run compile
```

## Contributing

Before opening a pull request, please ensure:

- tests pass
- the extension still compiles
- any user-visible behavior is documented
- screenshots are updated when UI changes affect the interface

For more details, see [CONTRIBUTING.md](../CONTRIBUTING.md).
