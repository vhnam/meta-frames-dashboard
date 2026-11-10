import { describe, expect, it } from "vite-plus/test";
import { expiryState } from "./format";
import { groupByStock, groupSummary, parseRollListSearch, rollsInView } from "./rollList";
import type { RollRow, RollStatus } from "./types";

const now = new Date(2026, 10, 10); // 10 Nov 2026

let next = 0;
function row(
  expiry: [number, number?] | null,
  overrides: { status?: RollStatus; stockId?: string; format?: string; atLab?: boolean } = {},
): RollRow {
  next += 1;
  const stockId = overrides.stockId ?? "orwo";
  return {
    roll: {
      id: `roll-${next}`,
      stockId,
      format: overrides.format ?? "135",
      exposures: 36,
      price: null,
      expiryYear: expiry?.[0] ?? null,
      expiryMonth: expiry?.[1] ?? null,
      status: overrides.status ?? "in_stock",
      cameraId: null,
      lensIds: [],
      shotIso: null,
      startDate: null,
      finishDate: null,
      description: "",
      createdAt: "",
      version: null,
    },
    stockName: stockId === "orwo" ? "ORWO NC500" : "Kodak Gold",
    boxIso: "",
    cameraName: null,
    negativesAtLab: overrides.atLab ?? false,
  };
}

const months = (expiry: [number, number?] | null) =>
  expiryState({ expiryYear: expiry?.[0] ?? null, expiryMonth: expiry?.[1] ?? null }, now);

describe("expiryState", () => {
  it("splits expired, within 6 months, later and unknown", () => {
    expect(months([2026, 8])).toBe("expired");
    expect(months([2026, 11])).toBe("soon"); // good to the end of this month
    expect(months([2027, 4])).toBe("soon");
    expect(months([2027, 5])).toBe("later"); // ends 31 May, past 10 May
    expect(months(null)).toBe("undated");
  });

  it("reads a year-only expiry as the end of that year", () => {
    expect(months([2025])).toBe("expired");
    expect(months([2026])).toBe("soon");
    expect(months([2027])).toBe("later");
  });
});

describe("rollsInView", () => {
  const expired = row([2026, 8]);
  const thisMonth = row([2026, 11]);
  const soon = row([2027, 2]);
  const later = row([2028, 1]);
  const yearOnly = row([2026]);
  const undated = row(null);
  const shooting = row([2020, 1], { status: "in_camera" });
  const rows = [undated, later, soon, shooting, yearOnly, thisMonth, expired];
  const ids = (list: RollRow[]) => list.map((item) => item.roll.id);

  it("sorts in stock rolls by expiry, expired first and undated last", () => {
    expect(ids(rollsInView(rows, { tab: "in_stock" }, now))).toEqual(
      ids([expired, thisMonth, yearOnly, soon, later, undated]),
    );
  });

  it("filters by expiry", () => {
    const view = (expiry: "expired" | "soon" | "alert" | "undated") =>
      ids(rollsInView(rows, { tab: "in_stock", expiry }, now));
    expect(view("expired")).toEqual(ids([expired]));
    expect(view("soon")).toEqual(ids([thisMonth, yearOnly, soon]));
    expect(view("alert")).toEqual(ids([expired, thisMonth, yearOnly, soon]));
    expect(view("undated")).toEqual(ids([undated]));
  });

  it("lists every roll once in All", () => {
    expect(ids(rollsInView(rows, {}, now))).toEqual(ids(rows));
  });

  it("keeps a scanned roll out of Complete until its negatives are home", () => {
    const atLab = row([2026, 1], { status: "scanned", atLab: true });
    expect(rollsInView([atLab, expired], { complete: true }, now)).toEqual([]);
    const home = { ...atLab, negativesAtLab: false };
    expect(ids(rollsInView([home, expired], { complete: true }, now))).toEqual(ids([home]));
  });
});

describe("groupByStock", () => {
  const rows = [
    row([2027, 3]),
    row(null),
    row([2026, 12]),
    row([2027, 1], { format: "120" }),
    row(null, { format: "120" }),
    row([2026, 9], { stockId: "gold" }),
  ];

  it("counts rolls per format and keeps the soonest known expiry", () => {
    const [gold, orwo] = groupByStock(rollsInView(rows, { tab: "in_stock" }, now));
    expect(groupSummary(orwo!)).toBe("ORWO NC500 · 3 × 135 · 2 × 120 · 12/2026");
    expect(orwo!.count).toBe(5);
    expect(gold!.count).toBe(1);
  });

  it("counts only the rolls that match the filter, as the open group lists", () => {
    const view = rollsInView(rows, { tab: "in_stock", expiry: "soon" }, now);
    const orwo = groupByStock(view).find((group) => group.stockId === "orwo")!;
    const opened = view.filter((item) => item.roll.stockId === "orwo");
    expect(groupSummary(orwo)).toBe("ORWO NC500 · 2 × 135 · 1 × 120 · 12/2026");
    expect(orwo.count).toBe(opened.length);
  });
});

describe("parseRollListSearch", () => {
  it("keeps in stock filters only on the In stock tab", () => {
    expect(
      parseRollListSearch({ tab: "in_stock", expiry: "alert", group: "stock", iso: 400 }),
    ).toEqual({ tab: "in_stock", expiry: "alert", group: "stock", iso: "400" });
    // a box ISO can be a range
    expect(parseRollListSearch({ tab: "in_stock", iso: "100-400" }).iso).toBe("100-400");
    expect(parseRollListSearch({ tab: "at_lab", expiry: "alert", complete: true })).toEqual({
      tab: "at_lab",
    });
    expect(parseRollListSearch({ tab: "nope", complete: "true", expiry: "bad" })).toEqual({
      complete: true,
    });
  });
});
