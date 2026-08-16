import { strict as assert } from "assert";
import * as fs from "fs";
import * as path from "path";
import { generateDependenciesCMake, generateProjectLinkCMake } from "../cmakeGenerator";
import { DependencyFile } from "../dependencyModel";

describe("cmakeGenerator", () => {
  const tmpDir = path.join(__dirname, "..", "..", "tmp-test");

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  it("generates dependencies.cmake with find_package using the library name and FetchContent", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          tag: "main",
          cmakePackage: "jsonfortran-cmake"
        }
      ]
    };

    generateDependenciesCMake(tmpDir, deps);

    const filePath = path.join(tmpDir, "cmake", "dependencies.cmake");
    const content = fs.readFileSync(filePath, "utf8");

    assert(content.includes("find_package(jsonfortran QUIET)"));
    assert(!content.includes("find_package(jsonfortran-cmake QUIET)"));
    assert(content.includes("FetchContent_Declare("));
    assert(content.includes("GIT_REPOSITORY https://github.com/jacobwilliams/json-fortran"));
  });

  it("uses the dependency version when present in the find_package call", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          version: "v1.2.3",
          tag: "main",
          cmakePackage: "jsonfortran"
        }
      ]
    };

    generateDependenciesCMake(tmpDir, deps);

    const filePath = path.join(tmpDir, "cmake", "dependencies.cmake");
    const content = fs.readFileSync(filePath, "utf8");

    assert(content.includes("find_package(jsonfortran v1.2.3 QUIET)"));
    assert(content.includes("GIT_TAG main"));
  });

  it("creates an alias target for the CMake package name when FetchContent is used", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          tag: "main",
          cmakePackage: "jsonfortran-cmake"
        }
      ]
    };

    generateDependenciesCMake(tmpDir, deps);

    const filePath = path.join(tmpDir, "cmake", "dependencies.cmake");
    const content = fs.readFileSync(filePath, "utf8");

    assert(content.includes("add_library(jsonfortran-cmake INTERFACE IMPORTED GLOBAL)"));
    assert(content.includes("target_link_libraries(jsonfortran-cmake INTERFACE jsonfortran)"));
  });

  it("writes a target_link_libraries call for each dependency", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          tag: "main",
          cmakePackage: "jsonfortran"
        },
        {
          name: "fmt",
          repo: "https://github.com/fmtlib/fmt",
          tag: "10.2.1",
          cmakePackage: "fmt"
        }
      ]
    };

    generateDependenciesCMake(tmpDir, deps);

    const filePath = path.join(tmpDir, "cmake", "dependencies.cmake");
    const content = fs.readFileSync(filePath, "utf8");

    assert(!content.includes("target_link_libraries"));
  });

  it("writes the link step into the primary CMakeLists.txt after add_executable", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          tag: "main",
          cmakePackage: "jsonfortran"
        }
      ]
    };

    const cmakeListsPath = path.join(tmpDir, "CMakeLists.txt");
    fs.writeFileSync(
      cmakeListsPath,
      "cmake_minimum_required(VERSION 3.20)\nproject(test LANGUAGES Fortran)\nadd_executable(test src/main.f90)\n",
      "utf8"
    );

    generateProjectLinkCMake(tmpDir, deps);
    const content = fs.readFileSync(cmakeListsPath, "utf8");

    assert(content.includes("add_executable(test src/main.f90)\ntarget_link_libraries(${PROJECT_NAME} PRIVATE jsonfortran)"));
  });

  it("removes stale target_link_libraries entries before inserting the current dependency set", () => {
    const deps: DependencyFile = {
      dependencies: [
        {
          name: "jsonfortran",
          repo: "https://github.com/jacobwilliams/json-fortran",
          tag: "main",
          cmakePackage: "jsonfortran"
        }
      ]
    };

    const cmakeListsPath = path.join(tmpDir, "CMakeLists.txt");
    fs.writeFileSync(
      cmakeListsPath,
      "cmake_minimum_required(VERSION 3.20)\nproject(test LANGUAGES Fortran)\nadd_executable(test src/main.f90)\ntarget_link_libraries(${PROJECT_NAME} PRIVATE oldlib)\n",
      "utf8"
    );

    generateProjectLinkCMake(tmpDir, deps);
    const content = fs.readFileSync(cmakeListsPath, "utf8");

    assert(content.includes("target_link_libraries(${PROJECT_NAME} PRIVATE jsonfortran)"));
    assert(!content.includes("oldlib"));
    assert(content.match(/target_link_libraries\(/g)?.length === 1);
  });
});
