import { queryOptions, useQuery } from "@tanstack/vue-query";
import type { Lab } from "#/domain/types";
import { http } from "./http";
import { labKeys, rollKeys } from "./keys";
import { useApiMutation } from "./mutation";

interface ApiLab {
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

export const useLabList = () => useQuery(labQueries.list());

export const useSaveLab = () =>
  useApiMutation({
    fn: async (v: { id?: string; name: string; address: string }) => {
      const body = { name: v.name.trim(), address: v.address.trim() || undefined };
      if (v.id) {
        await http.put(`/labs/${v.id}`, body);
        return v.id;
      }
      return (await http.post<ApiLab>("/labs", body)).data.id;
    },
    // lab names appear on jobs and roll histories
    invalidates: (v) => (v.id ? [labKeys.all, rollKeys.details()] : [labKeys.all]),
    success: "Lab saved",
  });

export const useDeleteLab = () =>
  useApiMutation({
    fn: async (id: string) => {
      await http.delete(`/labs/${id}`);
    },
    invalidates: () => [labKeys.all],
    success: "Lab deleted",
  });
