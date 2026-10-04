import { beforeEach, describe, expect, it } from "vite-plus/test";
import { installFakeServer, server } from "#/test/fakeServer";
import { queryClient } from "#/shared/api/client";
import { rollQueries } from "./api";

installFakeServer();

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("roll detail", () => {
  it("maps GET /rolls/{id} into the detail view model", async () => {
    const stock = server.addStock({ name: "ColorPlus 200", boxIso: 200 });
    const roll = server.addRoll({ filmStockId: stock.id, price: 341000 });
    const detail = await queryClient.fetchQuery(rollQueries.detail(roll.id));
    expect(detail?.stock.name).toBe("ColorPlus 200");
    expect(detail?.roll).toMatchObject({
      id: roll.id,
      format: "135",
      exposures: 36,
      price: 341000,
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
