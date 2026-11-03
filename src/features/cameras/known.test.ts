import { describe, expect, it } from "vite-plus/test";
import { countSome, countUnique } from "./known";

describe("countUnique", () => {
  it("merges case variants, drops blanks, counts uses and sorts", () => {
    expect(countUnique(["Nikon F", " nikon f", "", undefined, "Leica M", "Nikkon F"])).toEqual([
      { value: "Leica M", count: 1 },
      { value: "Nikkon F", count: 1 },
      { value: "Nikon F", count: 2 },
    ]);
  });
  it("merges values that differ only by invisible characters or Unicode form", () => {
    expect(countUnique(["Nikon", "Nikon\u200B", "\uFEFFNikon", "Nikon\u00A0"])).toEqual([
      { value: "Nikon", count: 4 },
    ]);
    expect(countUnique(["Voigtla\u0308nder", "Voigtl\u00E4nder"])).toEqual([
      { value: "Voigtl\u00E4nder", count: 2 },
    ]);
  });
});

describe("countSome", () => {
  it("counts only the kind being added and keeps other known values with no count", () => {
    // one Nikon lens and one Nikon camera: a lens form shows Nikon once, used by one lens
    expect(countSome(["Nikon"], ["Nikon", "Leica"])).toEqual([
      { value: "Leica" },
      { value: "Nikon", count: 1 },
    ]);
  });
  it("merges a brand across kinds whatever its case", () => {
    expect(countSome(["NIKON"], ["Nikon"])).toEqual([{ value: "NIKON", count: 1 }]);
  });
});
