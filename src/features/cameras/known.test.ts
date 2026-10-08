import { describe, expect, it } from "vite-plus/test";
import { countUnique } from "./known";

describe("countUnique", () => {
  it("merges case variants, drops blanks, counts uses and sorts", () => {
    expect(countUnique(["Nikon F", " nikon f", "", undefined, "Leica M", "Nikkon F"])).toEqual([
      { value: "Leica M", count: 1 },
      { value: "Nikkon F", count: 1 },
      { value: "Nikon F", count: 2 },
    ]);
  });
});
