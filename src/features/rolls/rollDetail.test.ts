import { beforeEach, describe, expect, it } from "vite-plus/test";
import { installFakeServer, server } from "#/test/fakeServer";
import { queryClient } from "#/shared/api/client";
import { rollQueries } from "./api";
import { canMarkDeveloped, canStartHomeScan } from "./types";
import type { RollJob } from "./types";

installFakeServer();

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("roll detail", () => {
  it("maps GET /rolls/{id} into the detail view model", async () => {
    const stock = server.addStock({ name: "ColorPlus 200", boxIso: "200" });
    const roll = server.addRoll({
      filmStockId: stock.id,
      price: 341000,
      finishedAt: "2026-10-05",
    });
    const detail = await queryClient.fetchQuery(rollQueries.detail(roll.id));
    expect(detail?.stock.name).toBe("ColorPlus 200");
    expect(detail?.roll).toMatchObject({
      id: roll.id,
      format: "135",
      exposures: 36,
      price: 341000,
      finishDate: "2026-10-05",
    });
    expect(detail?.cost).toEqual({ total: 341000, incomplete: false });
    expect(detail?.camera).toBeNull();
  });

  it("loads the camera and its lenses for a loaded roll", async () => {
    const cam = server.addCamera({}, { brand: "Canon" });
    const roll = server.addRoll({ cameraId: cam.id, status: "in_camera" });
    const detail = await queryClient.fetchQuery(rollQueries.detail(roll.id));
    expect(detail?.camera?.fixedLens).toBe(true);
    expect(detail?.cameraLenses).toHaveLength(1);
  });

  it("returns null for an unknown roll", async () => {
    expect(await queryClient.fetchQuery(rollQueries.detail("nope"))).toBeNull();
  });
});

const job = (overrides: Partial<RollJob>): RollJob => ({
  id: "job",
  labId: "lab",
  labName: "Lab",
  type: "develop",
  process: "C-41",
  sentDate: "2026-10-02",
  scansExpectedDate: null,
  negativesExpectedDate: null,
  scansReceivedDate: null,
  negativesReturnedDate: null,
  developedDate: null,
  price: null,
  order: null,
  notes: "",
  scanOrders: [],
  open: true,
  ...overrides,
});

describe("detail actions", () => {
  it("offers Mark as developed for an open develop job without its date, or a roll with no job", () => {
    expect(canMarkDeveloped("at_lab", [job({})], true)).toBe(true);
    expect(canMarkDeveloped("at_lab", [job({ type: "develop_scan" })], false)).toBe(true);
    expect(canMarkDeveloped("done_shooting", [], false)).toBe(true);
    // the last lab job was cancelled but the lab still holds the roll
    expect(canMarkDeveloped("done_shooting", [], true)).toBe(false);
    expect(canMarkDeveloped("at_lab", [job({ developedDate: "2026-10-03" })], false)).toBe(false);
    // an old develop + scan job with the negatives back is developed already
    expect(
      canMarkDeveloped(
        "at_lab",
        [job({ type: "develop_scan", negativesReturnedDate: "2026-10-04" })],
        false,
      ),
    ).toBe(false);
    expect(canMarkDeveloped("developed", [job({ open: false })], false)).toBe(false);
    expect(canMarkDeveloped("scanned", [job({ type: "scan" })], false)).toBe(false);
  });

  it("offers a home scan to a roll waiting for a scan or marked for one", () => {
    expect(canStartHomeScan("developed", "waiting_scan", false)).toBe(true);
    expect(canStartHomeScan("developed", "waiting_lab_scan", false)).toBe(true);
    expect(canStartHomeScan("scanned", null, true)).toBe(true);
    expect(canStartHomeScan("scanned", "lab_scanning", false)).toBe(false);
    expect(canStartHomeScan("scanned", null, false)).toBe(false);
    expect(canStartHomeScan("done_shooting", null, true)).toBe(true);
    // developed by a lab that still holds it: offered, and the page disables it with the reason
    expect(canStartHomeScan("at_lab", "waiting_home_scan", false)).toBe(true);
    // marked while still developing at home: the API takes no scan job yet
    expect(canStartHomeScan("at_lab", "home_developing", true)).toBe(false);
  });
});
