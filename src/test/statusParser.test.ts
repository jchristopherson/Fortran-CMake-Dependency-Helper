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

  it("returns empty map for empty output", () => {
    const status = parseCMakeOutputForStatus("");
    assert.deepEqual(status, {});
  });
});
