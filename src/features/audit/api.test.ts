import { describe, expect, it } from "vite-plus/test";
import { diffRows } from "./api";

describe("diffRows", () => {
  it("lists changed columns and ignores updated_at", () => {
    expect(
      diffRows(
        { id: "1", model: "FM2", updated_at: "a", deleted_at: null },
        { id: "1", model: "FM3A", updated_at: "b", deleted_at: null },
      ),
    ).toEqual([{ field: "model", before: "FM2", after: "FM3A" }]);
  });

  it("treats a missing before row as all-new fields", () => {
    expect(diffRows(undefined, { id: "1" })).toEqual([
      { field: "id", before: undefined, after: "1" },
    ]);
  });
});
