import { strict as assert } from "assert";
import * as fs from "fs";
import * as path from "path";
import { generateDependenciesCMake } from "../cmakeGenerator";
import { DependencyFile } from "../dependencyModel";

describe("cmakeGenerator", () => {
  const tmpDir = path.join(__dirname, "..", "..", "tmp-test");

  beforeEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    fs.mkdirSync(tmpDir, { recursive: true });
  });

  it("generates dependencies.cmake with find_package and FetchContent", () => {
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

    generateDependenciesCMake(tmpDir, deps);

    const filePath = path.join(tmpDir, "cmake", "dependencies.cmake");
    const content = fs.readFileSync(filePath, "utf8");

    assert(content.includes("find_package(jsonfortran QUIET)"));
    assert(content.includes("FetchContent_Declare("));
    assert(content.includes("GIT_REPOSITORY https://github.com/jacobwilliams/json-fortran"));
  });
});
