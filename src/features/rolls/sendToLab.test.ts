import { beforeEach, describe, expect, it } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { sendToLab } from "./api";

installFakeServer();

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("sendToLab", () => {
  it("creates a processing job through PUT /rolls/{id}/processing/{jobId}", async () => {
    const stock = server.addStock({ name: "Tri-X" });
    const roll = server.addRoll({ filmStockId: stock.id, status: "done_shooting" });
    await sendToLab({
      rollId: roll.id,
      input: { type: "develop_scan", process: "BW", price: 280000, labId: "", scanOrders: [] },
    });
    const req = server.requests.at(-1)!;
    expect(req.method).toBe("put");
    expect(req.url).toMatch(new RegExp(`^/rolls/${roll.id}/processing/[0-9a-f-]{36}$`));
    expect(req.body).toEqual({
      type: "develop_scan",
      process: "BW",
      price: 280000,
      scanOrders: [],
    });
    expect(server.rolls[0].status).toBe("at_lab");
  });
});
