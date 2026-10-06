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
}

const toLab = (l: ApiLab): Lab => ({ id: l.id, name: l.name, address: l.address ?? "" });

export const labQueries = {
  list: () =>
    queryOptions({
      queryKey: labKeys.list(),
      queryFn: async (): Promise<Lab[]> => {
        const { data } = await http.get<ApiLab[]>("/labs");
        return data.map(toLab).sort((a, b) => a.name.localeCompare(b.name));
      },
    }),
};

export const saveLab = async (v: { id?: string; name: string; address: string }) => {
  const body = { name: v.name.trim(), address: v.address.trim() || undefined };
  if (v.id) {
    await http.put(`/labs/${v.id}`, body);
    return v.id;
  }
  return (await http.post<ApiLab>("/labs", body)).data.id;
};

export const deleteLab = async (id: string) => {
  await http.delete(`/labs/${id}`);
};
