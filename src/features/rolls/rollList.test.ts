import { describe, expect, it } from "vite-plus/test";
import { expiryState } from "./format";
import { ROLL_STAGES } from "./types";
import {
  canHandOver,
  countByTab,
  groupByStock,
  groupSummary,
  MAX_HAND_OVER,
  groupedSearch,
  handOverType,
  togglePicked,
  withoutListFilters,
  parseRollListSearch,
  rollsInView,
} from "./rollList";
import type { RollListRow, RollPlan, RollStage, RollStatus, StageDetail } from "./types";

const now = new Date(2026, 10, 10); // 10 Nov 2026

let next = 0;
function row(
  expiry: [number, number?] | null,
  overrides: {
    status?: RollStatus;
    stockId?: string;
    format?: string;
    atLab?: boolean;
    stage?: RollStage;
    detail?: StageDetail;
    needsScan?: boolean;
    plan?: Partial<RollPlan>;
  } = {},
): RollListRow {
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
    stage: overrides.stage ?? (overrides.status === "in_camera" ? "in_camera" : "in_stock"),
    stageDetail: overrides.detail ?? null,
    needsScan: overrides.needsScan ?? false,
    plan: { target: null, developBy: null, scanBy: null, ...overrides.plan },
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
  const ids = (list: RollListRow[]) => list.map((item) => item.roll.id);

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
});

describe("stage tabs and shared filters", () => {
  const ids = (list: RollListRow[]) => list.map((item) => item.roll.id);
  const finished = row(null, { status: "done_shooting", stage: "done_shooting" });
  const waiting = row(null, {
    status: "developed",
    stage: "processing",
    detail: "waiting_lab_scan",
    plan: { target: "scanned", developBy: "self", scanBy: "lab" },
  });
  const labDeveloping = row(null, {
    status: "at_lab",
    stage: "processing",
    detail: "lab_developing",
    atLab: true,
    plan: { target: "scanned", developBy: "lab", scanBy: "lab" },
  });
  // completed with negatives still at the lab, marked for a rescan, no plan
  const marked = row(null, { status: "scanned", stage: "completed", atLab: true, needsScan: true });
  const done = row(null, {
    status: "developed",
    stage: "completed",
    plan: { target: "developed" },
  });
  const rows = [
    row(null),
    row(null, { status: "in_camera" }),
    finished,
    waiting,
    labDeveloping,
    marked,
    done,
  ];

  it("puts every roll in exactly one stage tab, so the tabs add up to All", () => {
    const counts = countByTab(rows, {});
    const perStage = ROLL_STAGES.map((stage) => rollsInView(rows, { tab: stage }, now));
    expect(perStage.flat().length).toBe(rows.length);
    expect(new Set(ids(perStage.flat())).size).toBe(rows.length);
    expect(ROLL_STAGES.reduce((sum, stage) => sum + counts[stage], 0)).toBe(counts.all);
    expect(counts).toEqual({
      all: 7,
      in_stock: 1,
      in_camera: 1,
      done_shooting: 1,
      processing: 2,
      completed: 2,
    });
    expect(ids(rollsInView(rows, { tab: "processing" }, now))).toEqual(
      ids([waiting, labDeveloping]),
    );
  });

  it("applies the shared filters to every tab and to the counts", () => {
    expect(ids(rollsInView(rows, { atLab: true }, now))).toEqual(ids([labDeveloping, marked]));
    expect(ids(rollsInView(rows, { tab: "completed", needsScan: true }, now))).toEqual(
      ids([marked]),
    );
    expect(ids(rollsInView(rows, { tab: "completed", noPlan: true }, now))).toEqual(ids([marked]));
    expect(ids(rollsInView(rows, { developBy: "self" }, now))).toEqual(ids([waiting]));
    expect(ids(rollsInView(rows, { tab: "processing", scanBy: "unset" }, now))).toEqual([]);
    const counts = countByTab(rows, { atLab: true });
    expect(counts).toMatchObject({ all: 2, processing: 1, completed: 1, done_shooting: 0 });
  });

  it("lets only waiting rolls be picked in Processing and only marked rolls in Completed", () => {
    expect(canHandOver(finished, "done_shooting")).toBe(true);
    expect(canHandOver(waiting, "processing")).toBe(true);
    expect(canHandOver(labDeveloping, "processing")).toBe(false);
    expect(canHandOver(marked, "completed")).toBe(true);
    expect(canHandOver(done, "completed")).toBe(false);
    // the All tab and the stages before done shooting pick nothing
    expect(canHandOver(finished, undefined)).toBe(false);
    expect(canHandOver(rows[0]!, "in_stock")).toBe(false);
  });

  it("stops picking at the API's limit and keeps the rolls already picked", () => {
    const full = new Set(Array.from({ length: MAX_HAND_OVER }, (_, index) => `roll-${index}`));
    expect(togglePicked(full, "one-more", true)).toBeUndefined();
    // a roll already picked, or an untick, still works at the limit
    expect(togglePicked(full, "roll-0", true)?.size).toBe(MAX_HAND_OVER);
    expect(togglePicked(full, "roll-0", false)?.size).toBe(MAX_HAND_OVER - 1);
    expect(togglePicked(new Set(), "first", true)).toEqual(new Set(["first"]));
  });

  it("starts a picked roll on the job its plan asks for", () => {
    expect(handOverType(finished)).toBe("develop_scan");
    expect(handOverType({ ...finished, plan: { ...finished.plan, target: "developed" } })).toBe(
      "develop",
    );
    expect(handOverType({ ...finished, plan: { ...finished.plan, scanBy: "self" } })).toBe(
      "develop",
    );
    expect(handOverType(waiting)).toBe("scan");
    expect(handOverType(marked)).toBe("scan");
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
    expect(parseRollListSearch({ tab: "processing", expiry: "alert" })).toEqual({
      tab: "processing",
    });
    // an old status tab such as at_lab is no tab any more
    expect(parseRollListSearch({ tab: "at_lab", expiry: "bad" })).toEqual({});
  });

  it("clears only the shared filters, keeping the tab and the in-stock filters", () => {
    expect(
      withoutListFilters({
        tab: "in_stock",
        expiry: "expired",
        group: "stock",
        noPlan: true,
        scanBy: "lab",
      }),
    ).toEqual({ tab: "in_stock", expiry: "expired", group: "stock" });
  });

  it("keeps the shared filters and the expiry when grouping by stock is turned on or off", () => {
    const flat = { tab: "in_stock", expiry: "soon", developBy: "lab", needsScan: true } as const;
    expect(groupedSearch(flat, true)).toEqual({ ...flat, group: "stock" });
    // turning it off also closes an open group and drops the group table's own filters
    const open = { ...flat, group: "stock", stock: "orwo", iso: "400" } as const;
    expect(groupedSearch(open, false)).toEqual({ ...flat, group: undefined });
  });

  it("keeps the shared filters on every tab and drops unknown values", () => {
    expect(
      parseRollListSearch({
        tab: "completed",
        atLab: "true",
        needsScan: true,
        noPlan: "no",
        developBy: "unset",
        scanBy: "robot",
      }),
    ).toEqual({ tab: "completed", atLab: true, needsScan: true, developBy: "unset" });
  });
});
