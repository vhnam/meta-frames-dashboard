import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import type { Lab } from "./types";

export const labKeys = {
  all: ["labs"] as const,
  lists: () => [...labKeys.all, "list"] as const,
  list: () => [...labKeys.lists()] as const,
};

export interface ApiLab {
  id: string;
  name: string;
  address?: string;
  scannerIds?: string[];
  defaultScannerId?: string;
}

const toLab = (apiLab: ApiLab): Lab => ({
  id: apiLab.id,
  name: apiLab.name,
  address: apiLab.address ?? "",
  scannerIds: apiLab.scannerIds ?? [],
  defaultScannerId: apiLab.defaultScannerId,
});

export const labQueries = {
  list: () =>
    queryOptions({
      queryKey: labKeys.list(),
      queryFn: async (): Promise<Lab[]> => {
        const { data } = await http.get<ApiLab[]>("/labs");
        return data.map(toLab).sort((left, right) => left.name.localeCompare(right.name));
      },
    }),
};

export const saveLab = async (variables: {
  id?: string;
  name: string;
  address: string;
  scannerIds: string[];
  defaultScannerId?: string;
}) => {
  const body = {
    name: variables.name.trim(),
    address: variables.address.trim() || undefined,
    scannerIds: variables.scannerIds,
    defaultScannerId: variables.defaultScannerId,
  };
  if (variables.id) {
    await http.put(`/labs/${variables.id}`, body);
    return variables.id;
  }
  return (await http.post<ApiLab>("/labs", body)).data.id;
};

export const deleteLab = async (id: string) => {
  await http.delete(`/labs/${id}`);
};
