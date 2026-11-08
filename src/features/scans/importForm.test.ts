// @vitest-environment happy-dom
import { describe, expect, it } from "vite-plus/test";
import { buildImportForm, previewBody } from "./importForm";

const png = (name: string) => new File(["x"], name, { type: "image/png" });

describe("buildImportForm", () => {
  it("puts each frameNumber immediately before its file, after scanner and conflict rule", () => {
    const form = buildImportForm("scanner-1", "replace", [
      { file: png("b.png"), frameNumber: 7 },
      { file: png("a.png"), frameNumber: 3 },
    ]);
    const order = [...form.entries()].map(([name, value]) =>
      value instanceof File ? `${name}=${value.name}` : `${name}=${value}`,
    );
    expect(order).toEqual([
      "scannerId=scanner-1",
      "onConflict=replace",
      "frameNumber=7",
      "file=b.png",
      "frameNumber=3",
      "file=a.png",
    ]);
  });
});

describe("previewBody", () => {
  const names = ["000001.jpg", "000002.jpg"];

  it("counts from the start frame in sequential mode and ignores the shift", () => {
    expect(previewBody(names, "sequential", 5, 2)).toEqual({ fileNames: names, startFrame: 5 });
  });

  it("reads the names, sending a shift only when there is one", () => {
    expect(previewBody(names, "names", 5, 0)).toEqual({ fileNames: names });
    expect(previewBody(names, "names", 5, -1)).toEqual({ fileNames: names, offset: -1 });
  });
});
