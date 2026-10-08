import { describe, expect, it } from "vite-plus/test";
import { expiryFromNow } from "./format";

const now = new Date(2026, 9, 8); // 8 Oct 2026

describe("expiryFromNow", () => {
  it("says how long ago a roll expired", () => {
    expect(expiryFromNow({ expiryYear: 2026, expiryMonth: 8 }, now)).toBe("Expired 2 months ago");
    expect(expiryFromNow({ expiryYear: 2025, expiryMonth: null }, now)).toBe(
      "Expired 10 months ago",
    );
  });

  it("says how soon a roll expires", () => {
    expect(expiryFromNow({ expiryYear: 2026, expiryMonth: 10 }, now)).toBe("Expires this month");
    expect(expiryFromNow({ expiryYear: 2027, expiryMonth: 1 }, now)).toBe("Expires in 3 months");
  });

  it("returns null for an undated roll", () => {
    expect(expiryFromNow({ expiryYear: null, expiryMonth: null }, now)).toBeNull();
  });
});
