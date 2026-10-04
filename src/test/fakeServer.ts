import { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { http } from "#/shared/api/http";

/**
 * A tiny in-memory stand-in for the Meta-Frame API, plugged into the real axios
 * instance so tests exercise the same request/response mapping as the app.
 */

interface StockRec {
  id: string;
  brand: string;
  name: string;
  type: "color" | "bw" | "slide";
  boxIso: number;
  process: string;
  packaging: string;
  stockOrigin?: string;
  baseStockId?: string;
}
interface LensRec {
  id: string;
  brand: string;
  model: string;
  mount?: string;
  focalLength: number;
  maxAperture: number;
  isBuiltIn: boolean;
  isActive: boolean;
}
interface CameraRec {
  id: string;
  brand: string;
  model: string;
  mount?: string;
  description?: string;
  hasFixedLens: boolean;
  builtInLensId?: string;
  isActive: boolean;
}
interface RollRec {
  id: string;
  filmStockId: string;
  format: number;
  exposures: number;
  price?: number;
  expiry?: { year: number; month?: number };
  status: string;
  cameraId?: string;
  startedAt?: string;
}
interface LabRec {
  id: string;
  name: string;
  address?: string;
}

let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;

export const server = {
  cameras: [] as CameraRec[],
  lenses: [] as LensRec[],
  stocks: [] as StockRec[],
  rolls: [] as RollRec[],
  labs: [] as LabRec[],
  requests: [] as { method: string; url: string; body: unknown }[],

  reset() {
    this.cameras = [];
    this.lenses = [];
    this.stocks = [];
    this.rolls = [];
    this.labs = [];
    this.requests = [];
  },
  addStock(p: Partial<StockRec> = {}): StockRec {
    const s: StockRec = {
      id: id(),
      brand: "Kodak",
      name: "UltraMax 400",
      type: "color",
      boxIso: 400,
      process: "C-41",
      packaging: "factory",
      ...p,
    };
    this.stocks.push(s);
    return s;
  },
  addLens(p: Partial<LensRec> = {}): LensRec {
    const l: LensRec = {
      id: id(),
      brand: "Canon",
      model: "FD",
      mount: "FD",
      focalLength: 50,
      maxAperture: 1.8,
      isBuiltIn: false,
      isActive: true,
      ...p,
    };
    this.lenses.push(l);
    return l;
  },
  addCamera(p: Partial<CameraRec> = {}, builtIn?: Partial<LensRec>): CameraRec {
    const c: CameraRec = {
      id: id(),
      brand: "Nikon",
      model: "FM2",
      mount: "F",
      hasFixedLens: false,
      isActive: true,
      ...p,
    };
    if (builtIn || c.hasFixedLens) {
      c.hasFixedLens = true;
      c.mount = undefined;
      c.builtInLensId = this.addLens({ isBuiltIn: true, mount: undefined, ...builtIn }).id;
    }
    this.cameras.push(c);
    return c;
  },
  addRoll(p: Partial<RollRec> = {}): RollRec {
    const stock = this.stocks[0] ?? this.addStock();
    const r: RollRec = {
      id: id(),
      filmStockId: stock.id,
      format: 135,
      exposures: 36,
      status: "in_stock",
      ...p,
    };
    this.rolls.push(r);
    return r;
  },
  addLab(p: Partial<LabRec> = {}): LabRec {
    const l: LabRec = { id: id(), name: "Saigon Lab", ...p };
    this.labs.push(l);
    return l;
  },
};

const stockOf = (sid: string) => server.stocks.find((s) => s.id === sid);
const apiRoll = (r: RollRec) => {
  const st = stockOf(r.filmStockId);
  const cam = server.cameras.find((c) => c.id === r.cameraId);
  return {
    ...r,
    stockName: st ? `${st.name}` : "",
    stockBrand: st?.brand,
    cameraName: cam?.model,
    negativesAtLab: false,
  };
};

export function installFakeServer() {
  http.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const method = (config.method ?? "get").toLowerCase();
    const body = typeof config.data === "string" ? JSON.parse(config.data) : config.data;
    const params = (config.params ?? {}) as Record<string, unknown>;
    server.requests.push({ method, url, body });

    const respond = (status: number, data: unknown) => {
      const response = { data, status, statusText: String(status), headers: {}, config };
      if (status >= 400)
        throw new AxiosError(`HTTP ${status}`, "ERR_BAD_REQUEST", config, null, response);
      return response;
    };
    const notFound = (what: string) =>
      respond(404, { code: "not_found", message: `${what} not found` });
    const m = (re: RegExp) => re.exec(url);

    if (method === "get" && url === "/cameras") {
      return respond(
        200,
        server.cameras
          .filter((c) => c.isActive || !params.activeOnly)
          .map((c) => {
            const roll = server.rolls.find((r) => r.cameraId === c.id && r.status === "in_camera");
            const st = roll && stockOf(roll.filmStockId);
            return {
              ...c,
              loadedRoll: roll && {
                rollId: roll.id,
                stockName: st?.name ?? "",
                shotIso: st?.boxIso ?? 0,
                daysLoaded: 0,
              },
            };
          }),
      );
    }
    let r = m(/^\/cameras\/([^/]+)\/lenses$/);
    if (method === "get" && r) {
      const c = server.cameras.find((x) => x.id === r![1]);
      return respond(
        200,
        c?.builtInLensId ? server.lenses.filter((l) => l.id === c.builtInLensId) : [],
      );
    }
    r = m(/^\/cameras\/([^/]+)\/active$/);
    if (method === "put" && r) {
      const c = server.cameras.find((x) => x.id === r![1]);
      if (!c) return notFound("camera");
      c.isActive = body.isActive;
      const bl = server.lenses.find((l) => l.id === c.builtInLensId);
      if (bl) bl.isActive = body.isActive;
      return respond(200, c);
    }
    r = m(/^\/cameras\/([^/]+)$/);
    if (method === "get" && r) {
      const c = server.cameras.find((x) => x.id === r![1]);
      return c ? respond(200, c) : notFound("camera");
    }
    if (method === "get" && url === "/lenses") return respond(200, server.lenses);
    r = m(/^\/lenses\/([^/]+)\/active$/);
    if (method === "put" && r) {
      const l = server.lenses.find((x) => x.id === r![1]);
      if (!l) return notFound("lens");
      if (l.isBuiltIn)
        return respond(409, { code: "conflict", message: "A built-in lens follows its camera." });
      l.isActive = body.isActive;
      return respond(200, l);
    }
    if (method === "get" && url === "/film-stocks") return respond(200, server.stocks);
    r = m(/^\/film-stocks\/([^/]+)$/);
    if (method === "get" && r) {
      const s = stockOf(r[1]);
      if (!s) return notFound("film stock");
      const base = s.baseStockId ? stockOf(s.baseStockId) : undefined;
      return respond(200, {
        stock: s,
        baseStock: base,
        siblings: [],
        derived: server.stocks.filter((x) => x.baseStockId === s.id),
        warnings: [],
      });
    }
    if (method === "get" && url === "/inventory") {
      const items = server.stocks.flatMap((stock) => {
        const rolls = server.rolls.filter(
          (x) => x.filmStockId === stock.id && x.status === "in_stock",
        );
        if (!rolls.length) return [];
        const counts = new Map<number, number>();
        for (const x of rolls) counts.set(x.format, (counts.get(x.format) ?? 0) + 1);
        return [{ stock, formats: [...counts].map(([format, count]) => ({ format, count })) }];
      });
      return respond(200, items);
    }
    if (method === "get" && url === "/labs") return respond(200, server.labs);
    if (method === "get" && url === "/rolls") {
      return respond(
        200,
        server.rolls
          .filter((x) => !params.status || x.status === params.status)
          .filter((x) => !params.filmStockId || x.filmStockId === params.filmStockId)
          .filter((x) => !params.cameraId || x.cameraId === params.cameraId)
          .map(apiRoll),
      );
    }
    if (method === "post" && url === "/rolls/bulk") {
      if (!stockOf(body.filmStockId))
        return respond(422, { code: "unknown_film_stock", message: "film stock does not exist" });
      for (let i = 0; i < body.quantity; i++) {
        server.addRoll({
          filmStockId: body.filmStockId,
          format: body.format,
          exposures: body.exposures,
          price: body.price,
          expiry: body.expiry,
        });
      }
      return respond(201, {});
    }
    r = m(/^\/rolls\/([^/]+)$/);
    if (r) {
      const roll = server.rolls.find((x) => x.id === r![1]);
      if (!roll) return notFound("roll");
      if (method === "get") {
        const st = stockOf(roll.filmStockId)!;
        return respond(200, {
          roll: apiRoll(roll),
          stock: st,
          lenses: [],
          frames: [],
          processing: [],
          totals: { total: roll.price ?? 0, incomplete: roll.price == null },
        });
      }
      if (method === "put") {
        Object.assign(roll, {
          filmStockId: body.filmStockId,
          format: body.format,
          exposures: body.exposures,
          price: body.price,
          expiry: body.expiry,
        });
        return respond(200, {});
      }
      if (method === "delete") {
        server.rolls = server.rolls.filter((x) => x !== roll);
        return respond(204, undefined);
      }
    }
    throw new Error(`Unhandled fake request: ${method} ${url}`);
  };
}
