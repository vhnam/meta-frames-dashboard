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
    await finishRoll(roll.id);
    expect(server.requests.at(-1)).toMatchObject({
      method: "put",
      url: `/rolls/${roll.id}/finish`,
    });
    expect(server.rolls[0].status).toBe("done_shooting");
  });
});
