import { strict as assert } from "assert";
import { parseCMakeOutputForStatus } from "../statusParser";

describe("statusParser", () => {
  it("detects fallback and found", () => {
    const output = `
      jsonfortran not found; using FetchContent fallback
      Found otherlib
    `;
    const status = parseCMakeOutputForStatus(output);

    assert.equal(status["jsonfortran"], "fallback");
    assert.equal(status["otherlib"], "found");
  });

  it("detects status for aliased or hyphenated package names", () => {
    const output = `
      Could NOT find jsonfortran (missing: JSONFORTRAN_LIBRARIES)
      -- Found jsonfortran-cmake
    `;
    const status = parseCMakeOutputForStatus(output);

    assert.equal(status["jsonfortran"], "failed");
    assert.equal(status["jsonfortran-cmake"], "found");
  });

  it("normalizes casing from CMake output so dependency names match tree entries", () => {
    const output = `
      -- Found JSONFORTRAN
      jsonfortran not found; using FetchContent fallback
    `;
    const status = parseCMakeOutputForStatus(output);

    assert.equal(status["jsonfortran"], "fallback");
  });

  it("returns empty map for empty output", () => {
    const status = parseCMakeOutputForStatus("");
    assert.deepEqual(status, {});
  });
});
