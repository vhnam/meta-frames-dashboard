import { describe, expect, it } from "vite-plus/test";
import { plainText } from "./format";

describe("plainText", () => {
  it("leaves plain notes alone", () => {
    expect(plainText("Rated at 320, C-41.")).toBe("Rated at 320, C-41.");
  });

  it("drops Markdown marks and joins lines", () => {
    expect(
      plainText("## Push\n\n**one stop**, *warm* ~~cool~~ `D-76`\n\n- fine grain\n1. scan"),
    ).toBe("Push one stop, warm cool D-76 fine grain scan");
  });

  it("keeps link text and unescapes characters", () => {
    expect(plainText("See [datasheet](https://x.test) \\*ISO\\*")).toBe("See datasheet *ISO*");
  });

  it("keeps snake_case and lone asterisks", () => {
    expect(plainText("file_name_v2 and 2 * 3")).toBe("file_name_v2 and 2 * 3");
  });
});
