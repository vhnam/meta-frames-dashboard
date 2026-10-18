import { describe, expect, it } from "vite-plus/test";
import { formatDate, formatDateTime, plainText } from "./format";

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

describe("formatDate", () => {
  it("shows an ISO date as dd/mm/yyyy without a time zone shift", () => {
    expect(formatDate("2026-01-05")).toBe("05/01/2026");
  });

  it("shows a date-time by its local day, and a dash when empty", () => {
    expect(formatDate(new Date(2026, 9, 11, 23, 30).toISOString())).toBe("11/10/2026");
    expect(formatDate(null)).toBe("—");
  });
});

describe("formatDateTime", () => {
  it("adds the local time as HH:mm", () => {
    expect(formatDateTime(new Date(2026, 9, 11, 9, 5).toISOString())).toBe("11/10/2026 09:05");
  });
});
