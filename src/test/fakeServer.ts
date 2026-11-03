import { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { http } from "#/shared/api/http";

/**
 * A tiny in-memory stand-in for the Meta-Frame API, plugged into the real axios
 * instance so tests exercise the same request/response mapping as the app.
 */

interface LabOrderBody {
  labId: string;
  code: string;
  orderedAt: string;
  dueDate?: string;
  vat?: number;
  discount?: number;
  notes?: string;
  items: { id: string; product: string; options?: string; quantity: number; unitPrice: number }[];
}
interface LabOrderRec extends Omit<LabOrderBody, "items"> {
  id: string;
  labName: string;
  subtotal: number;
  total: number;
  items: (LabOrderBody["items"][number] & {
    lineTotal: number;
    unitCost: number;
    jobs: unknown[];
  })[];
}
interface StockRec {
  id: string;
  brand: string;
  name: string;
  type: "color" | "bw" | "slide";
  boxIso: string;
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
  finishedAt?: string;
  lensIds?: string[];
}
interface LabRec {
  id: string;
  name: string;
  address?: string;
  scannerIds?: string[];
  defaultScannerId?: string;
}
interface ScannerRec {
  id: string;
  brand: string;
  model: string;
  name: string;
  kind?: string;
  notes?: string;
  defaultSettings: Record<string, unknown>;
  builtIn: boolean;
}

const resolution = {
  key: "resolution",
  label: "Resolution",
  type: "enum",
  values: [
    { value: "standard", label: "Standard" },
    { value: "hi_res", label: "Hi-res" },
  ],
  default: "standard",
};
/** A part of the API's scan options: enough for each field type. */
export const scannerKinds = [
  { kind: "minilab", label: "Lab minilab", options: [resolution] },
  {
    kind: "flatbed",
    label: "Flatbed",
    options: [
      {
        key: "dpi",
        label: "Resolution (dpi)",
        type: "integer",
        min: 300,
        max: 12800,
        default: 3200,
      },
      { key: "dust_removal", label: "Dust removal (ICE)", type: "boolean", default: false },
    ],
  },
  { label: "Unknown kind", options: [resolution] },
];

/** The API's two built-in scanners, with their fixed ids. */
const builtInScanners = (): ScannerRec[] => [
  {
    id: "e2bf4cbd-87a8-4a17-8340-516b1a1cc6bc",
    brand: "Frontier",
    model: "SP-3000",
    name: "Frontier SP-3000",
    kind: "minilab",
    defaultSettings: {},
    builtIn: true,
  },
  {
    id: "d177cb3c-a850-4232-a4ca-75189b7b279b",
    brand: "Noritsu",
    model: "HS-1800",
    name: "Noritsu HS-1800",
    kind: "minilab",
    defaultSettings: {},
    builtIn: true,
  },
];

let counter = 0;
const id = () => `00000000-0000-4000-8000-${String(++counter).padStart(12, "0")}`;

export const server = {
  cameras: [] as CameraRec[],
  lenses: [] as LensRec[],
  stocks: [] as StockRec[],
  rolls: [] as RollRec[],
  labs: [] as LabRec[],
  labOrders: [] as LabOrderRec[],
  linkableJobs: [] as unknown[],
  scanners: builtInScanners(),
  requests: [] as { method: string; url: string; body: unknown }[],

  reset() {
    this.cameras = [];
    this.lenses = [];
    this.stocks = [];
    this.rolls = [];
    this.labs = [];
    this.labOrders = [];
    this.linkableJobs = [];
    this.scanners = builtInScanners();
    this.requests = [];
  },
  /** An order as the API returns it: amounts worked out, VAT and discount shared out by price. */
  saveLabOrder(orderId: string, input: LabOrderBody): LabOrderRec {
    const subtotal = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const share = subtotal ? ((input.vat ?? 0) - (input.discount ?? 0)) / subtotal : 0;
    const previous = this.labOrders.find((record) => record.id === orderId);
    const order: LabOrderRec = {
      ...input,
      id: orderId,
      labName: this.labs.find((lab) => lab.id === input.labId)?.name ?? "",
      vat: input.vat ?? 0,
      discount: input.discount ?? 0,
      subtotal,
      total: subtotal + (input.vat ?? 0) - (input.discount ?? 0),
      items: input.items.map((item) => ({
        ...item,
        lineTotal: item.quantity * item.unitPrice,
        unitCost: Math.round(item.unitPrice * (1 + share)),
        jobs: previous?.items.find((line) => line.id === item.id)?.jobs ?? [],
      })),
    };
    this.labOrders = [...this.labOrders.filter((record) => record.id !== orderId), order];
    return order;
  },
  addStock(overrides: Partial<StockRec> = {}): StockRec {
    const stock: StockRec = {
      id: id(),
      brand: "Kodak",
      name: "UltraMax 400",
      type: "color",
      boxIso: "400",
      process: "C-41",
      packaging: "factory",
      ...overrides,
    };
    this.stocks.push(stock);
    return stock;
  },
  addLens(overrides: Partial<LensRec> = {}): LensRec {
    const lens: LensRec = {
      id: id(),
      brand: "Canon",
      model: "FD",
      mount: "FD",
      focalLength: 50,
      maxAperture: 1.8,
      isBuiltIn: false,
      isActive: true,
      ...overrides,
    };
    this.lenses.push(lens);
    return lens;
  },
  addCamera(overrides: Partial<CameraRec> = {}, builtIn?: Partial<LensRec>): CameraRec {
    const camera: CameraRec = {
      id: id(),
      brand: "Nikon",
      model: "FM2",
      mount: "F",
      hasFixedLens: false,
      isActive: true,
      ...overrides,
    };
    if (builtIn || camera.hasFixedLens) {
      camera.hasFixedLens = true;
      camera.mount = undefined;
      camera.builtInLensId = this.addLens({ isBuiltIn: true, mount: undefined, ...builtIn }).id;
    }
    this.cameras.push(camera);
    return camera;
  },
  addRoll(overrides: Partial<RollRec> = {}): RollRec {
    const stock = this.stocks[0] ?? this.addStock();
    const roll: RollRec = {
      id: id(),
      filmStockId: stock.id,
      format: 135,
      exposures: 36,
      status: "in_stock",
      ...overrides,
    };
    this.rolls.push(roll);
    return roll;
  },
  addLab(overrides: Partial<LabRec> = {}): LabRec {
    const lab: LabRec = { id: id(), name: "Saigon Lab", ...overrides };
    this.labs.push(lab);
    return lab;
  },
  /** A scanner of the account's own. */
  addScanner(
    overrides: Partial<Omit<ScannerRec, "name" | "builtIn" | "defaultSettings">> & {
      defaultSettings?: Record<string, unknown>;
    } = {},
  ): ScannerRec {
    const brand = overrides.brand ?? "Epson";
    const model = overrides.model ?? "V850";
    const scanner: ScannerRec = {
      id: id(),
      kind: "flatbed",
      defaultSettings: {},
      ...overrides,
      brand,
      model,
      name: model ? `${brand} ${model}` : brand,
      builtIn: false,
    };
    this.scanners.push(scanner);
    return scanner;
  },
};

const stockOf = (sid: string) => server.stocks.find((stock) => stock.id === sid);
const apiRoll = (roll: RollRec) => {
  const st = stockOf(roll.filmStockId);
  const cam = server.cameras.find((camera) => camera.id === roll.cameraId);
  return {
    ...roll,
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
    const match = (re: RegExp) => re.exec(url);

    if (method === "get" && url === "/cameras") {
      return respond(
        200,
        server.cameras
          .filter((camera) => camera.isActive || !params.activeOnly)
          .map((camera) => {
            const roll = server.rolls.find(
              (record) => record.cameraId === camera.id && record.status === "in_camera",
            );
            const st = roll && stockOf(roll.filmStockId);
            return {
              ...camera,
              loadedRoll: roll && {
                rollId: roll.id,
                stockName: st?.name ?? "",
                shotIso: Number(st?.boxIso ?? 0),
                daysLoaded: 0,
              },
            };
          }),
      );
    }
    let route = match(/^\/cameras\/([^/]+)\/lenses$/);
    if (method === "get" && route) {
      const camera = server.cameras.find((record) => record.id === route![1]);
      return respond(
        200,
        camera?.builtInLensId
          ? server.lenses.filter((lens) => lens.id === camera.builtInLensId)
          : [],
      );
    }
    route = match(/^\/cameras\/([^/]+)\/active$/);
    if (method === "put" && route) {
      const camera = server.cameras.find((record) => record.id === route![1]);
      if (!camera) return notFound("camera");
      camera.isActive = body.isActive;
      const bl = server.lenses.find((lens) => lens.id === camera.builtInLensId);
      if (bl) bl.isActive = body.isActive;
      return respond(200, camera);
    }
    route = match(/^\/cameras\/([^/]+)$/);
    if (method === "get" && route) {
      const camera = server.cameras.find((record) => record.id === route![1]);
      return camera ? respond(200, camera) : notFound("camera");
    }
    if (method === "get" && url === "/lenses") return respond(200, server.lenses);
    route = match(/^\/lenses\/([^/]+)\/active$/);
    if (method === "put" && route) {
      const lens = server.lenses.find((record) => record.id === route![1]);
      if (!lens) return notFound("lens");
      if (lens.isBuiltIn)
        return respond(409, { code: "conflict", message: "A built-in lens follows its camera." });
      lens.isActive = body.isActive;
      return respond(200, lens);
    }
    if (method === "get" && url === "/film-stocks") return respond(200, server.stocks);
    route = match(/^\/film-stocks\/([^/]+)$/);
    if (method === "get" && route) {
      const stock = stockOf(route[1]);
      if (!stock) return notFound("film stock");
      const base = stock.baseStockId ? stockOf(stock.baseStockId) : undefined;
      return respond(200, {
        stock: stock,
        baseStock: base,
        siblings: [],
        derived: server.stocks.filter((record) => record.baseStockId === stock.id),
        warnings: [],
      });
    }
    if (method === "get" && url === "/inventory") {
      const items = server.stocks.flatMap((stock) => {
        const rolls = server.rolls.filter(
          (roll) => roll.filmStockId === stock.id && roll.status === "in_stock",
        );
        if (!rolls.length) return [];
        const counts = new Map<number, number>();
        for (const roll of rolls) counts.set(roll.format, (counts.get(roll.format) ?? 0) + 1);
        return [{ stock, formats: [...counts].map(([format, count]) => ({ format, count })) }];
      });
      return respond(200, items);
    }
    if (method === "get" && url === "/labs") return respond(200, server.labs);
    if (method === "get" && url === "/lab-orders") return respond(200, server.labOrders);
    route = match(/^\/lab-orders\/([^/]+)\/linkable-jobs$/);
    if (route && method === "get") return respond(200, server.linkableJobs);
    route = match(/^\/lab-orders\/([^/]+)$/);
    if (route && method === "get") {
      const order = server.labOrders.find((record) => record.id === route![1]);
      return order ? respond(200, order) : notFound("lab order");
    }
    if (route && method === "put") {
      const order = server.saveLabOrder(route[1], body);
      return respond(201, order);
    }
    if (route && method === "delete") {
      server.labOrders = server.labOrders.filter((record) => record.id !== route![1]);
      return respond(204, undefined);
    }
    if (/^\/processing\/[^/]+\/order-item$/.test(url) && (method === "put" || method === "delete"))
      return respond(200, {});
    if (method === "post" && url === "/labs")
      return respond(201, server.addLab({ ...body, scannerIds: body.scannerIds ?? [] }));
    if (method === "get" && url === "/scanners") return respond(200, server.scanners);
    if (method === "get" && url === "/scanner-kinds") return respond(200, scannerKinds);
    if (method === "post" && url === "/scanners")
      return respond(201, server.addScanner({ ...body }));
    if (method === "get" && url === "/rolls") {
      return respond(
        200,
        server.rolls
          .filter((roll) => !params.status || roll.status === params.status)
          .filter((roll) => !params.filmStockId || roll.filmStockId === params.filmStockId)
          .filter((roll) => !params.cameraId || roll.cameraId === params.cameraId)
          .filter((roll) => !params.lensId || !!roll.lensIds?.includes(params.lensId as string))
          .map(apiRoll),
      );
    }
    if (method === "post" && url === "/rolls/bulk") {
      if (!stockOf(body.filmStockId))
        return respond(422, { code: "unknown_film_stock", message: "film stock does not exist" });
      for (let index = 0; index < body.quantity; index++) {
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
    route = match(/^\/rolls\/([^/]+)\/lenses$/);
    if (route && method === "put") {
      const roll = server.rolls.find((record) => record.id === route![1]);
      if (!roll) return notFound("roll");
      roll.lensIds = body.lensIds;
      return respond(200, {});
    }
    route = match(/^\/rolls\/([^/]+)\/processing\/([^/]+)$/);
    if (route && method === "put") {
      const roll = server.rolls.find((record) => record.id === route![1]);
      if (!roll) return notFound("roll");
      roll.status = "at_lab";
      return respond(200, {});
    }
    if (method === "put" && /^\/processing\/[^/]+\/(scans-received|negatives-returned)$/.test(url))
      return respond(200, {});
    route = match(/^\/rolls\/([^/]+)\/finish$/);
    if (route && method === "put") {
      const roll = server.rolls.find((record) => record.id === route![1]);
      if (!roll) return notFound("roll");
      roll.status = "done_shooting";
      roll.finishedAt = body?.date ?? roll.finishedAt ?? "2026-10-05";
      return respond(200, {});
    }
    route = match(/^\/rolls\/([^/]+)\/load$/);
    if (route && method === "put") {
      const roll = server.rolls.find((record) => record.id === route![1]);
      if (!roll) return notFound("roll");
      const camera = server.cameras.find((record) => record.id === body.cameraId);
      if (!camera) return notFound("camera");
      const busy = server.rolls.find(
        (record) => record.cameraId === camera.id && record.status === "in_camera",
      );
      if (busy)
        return respond(409, {
          code: "conflict",
          message: "This camera already has a roll loaded.",
        });
      Object.assign(roll, {
        status: "in_camera",
        cameraId: body.cameraId,
        startedAt: body.startedAt ?? "2026-10-05",
      });
      return respond(200, {});
    }
    route = match(/^\/rolls\/([^/]+)$/);
    if (route) {
      const roll = server.rolls.find((record) => record.id === route![1]);
      if (!roll) return notFound("roll");
      if (method === "get") {
        const st = stockOf(roll.filmStockId)!;
        return respond(200, {
          roll: apiRoll(roll),
          stock: st,
          lenses: server.lenses.filter((lens) => roll.lensIds?.includes(lens.id)),
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
        server.rolls = server.rolls.filter((record) => record !== roll);
        return respond(204, undefined);
      }
    }
    throw new Error(`Unhandled fake request: ${method} ${url}`);
  };
}
