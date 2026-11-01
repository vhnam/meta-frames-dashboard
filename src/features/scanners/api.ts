import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import type { ScanSettings, Scanner, ScannerKind, ScannerKindOptions } from "./types";

export const scannerKeys = {
  all: ["scanners"] as const,
  lists: () => [...scannerKeys.all, "list"] as const,
  list: () => [...scannerKeys.lists()] as const,
  kinds: () => [...scannerKeys.all, "kinds"] as const,
};

export interface ApiScanner {
  id: string;
  brand: string;
  model?: string;
  name: string;
  kind?: ScannerKind;
  notes?: string;
  defaultSettings?: ScanSettings;
  builtIn: boolean;
}

const toScanner = (apiScanner: ApiScanner): Scanner => ({
  id: apiScanner.id,
  brand: apiScanner.brand,
  model: apiScanner.model ?? "",
  name: apiScanner.name,
  kind: apiScanner.kind ?? null,
  notes: apiScanner.notes ?? "",
  defaultSettings: apiScanner.defaultSettings ?? {},
  builtIn: apiScanner.builtIn,
});

export const scannerQueries = {
  /** Built-in scanners first, then the account's own, by name (the API's order). */
  list: () =>
    queryOptions({
      queryKey: scannerKeys.list(),
      queryFn: async (): Promise<Scanner[]> => {
        const { data } = await http.get<ApiScanner[]>("/scanners");
        return data.map(toScanner);
      },
    }),
  /** Scan options of each kind; they only change with the API, so they are kept for the session. */
  kinds: () =>
    queryOptions({
      queryKey: scannerKeys.kinds(),
      staleTime: Infinity,
      queryFn: async (): Promise<ScannerKindOptions[]> => {
        const { data } =
          await http.get<
            { kind?: ScannerKind; label: string; options: ScannerKindOptions["options"] }[]
          >("/scanner-kinds");
        return data.map((entry) => ({ ...entry, kind: entry.kind ?? null }));
      },
    }),
};

export interface ScannerInput {
  id?: string;
  brand: string;
  model: string;
  kind?: ScannerKind;
  notes: string;
  defaultSettings: ScanSettings;
}

export const saveScanner = async (variables: ScannerInput) => {
  const body = {
    brand: variables.brand.trim(),
    model: variables.model.trim() || undefined,
    kind: variables.kind || undefined,
    notes: variables.notes.trim() || undefined,
    defaultSettings: variables.defaultSettings,
  };
  if (variables.id) {
    await http.put(`/scanners/${variables.id}`, body);
    return variables.id;
  }
  return (await http.post<ApiScanner>("/scanners", body)).data.id;
};

export const deleteScanner = async (id: string) => {
  await http.delete(`/scanners/${id}`);
};
