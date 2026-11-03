import * as v from "valibot";
import { describe, expect, it } from "vite-plus/test";
import { StockSchema } from "./schema";

const stock = (boxIso: unknown) => ({
  brand: "Lomography",
  name: "Color",
  type: "color",
  boxIso,
  process: "C-41",
  packaging: "factory",
  stockOrigin: "",
  packOrigin: "",
  baseStockId: "",
  description: "",
});

describe("StockSchema box ISO", () => {
  it.each(["400", "100-400", "50-200"])("accepts %s", (boxIso) => {
    expect(v.safeParse(StockSchema, stock(boxIso)).success).toBe(true);
  });
  it.each(["", "0", "400-100", "200-200", "100-", "fast", 400, undefined])(
    "refuses %s",
    (boxIso) => {
      expect(v.safeParse(StockSchema, stock(boxIso)).success).toBe(false);
    },
  );
});
