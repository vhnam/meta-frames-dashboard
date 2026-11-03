import { beforeEach, describe, expect, it } from "vite-plus/test";
import { queryClient } from "#/shared/api/client";
import { installFakeServer, server } from "#/test/fakeServer";
import { finishRoll } from "./api";

installFakeServer();

beforeEach(() => {
  server.reset();
  queryClient.clear();
});

describe("finishRoll", () => {
  it("marks the roll as finished through PUT /rolls/{id}/finish", async () => {
    const stock = server.addStock({ name: "Portra" });
    const roll = server.addRoll({ filmStockId: stock.id, status: "in_camera" });
    await finishRoll({ id: roll.id, date: "2026-09-28" });
    expect(server.requests.at(-1)).toMatchObject({
      method: "put",
      url: `/rolls/${roll.id}/finish`,
      body: { date: "2026-09-28" },
    });
    expect(server.rolls[0].status).toBe("done_shooting");
    expect(server.rolls[0].finishedAt).toBe("2026-09-28");
  });
});
