import { queryOptions } from "@tanstack/vue-query";
import { http } from "#/shared/api/http";
import type { LabOrder, LabOrderInput, LabOrderJob } from "./types";

export const labOrderKeys = {
  all: ["lab-orders"] as const,
  lists: () => [...labOrderKeys.all, "list"] as const,
  list: () => [...labOrderKeys.lists()] as const,
  detail: (id: string) => [...labOrderKeys.all, "detail", id] as const,
  linkableJobs: (id: string) => [...labOrderKeys.all, "linkable-jobs", id] as const,
};

interface ApiLabOrderJob {
  id: string;
  rollId: string;
  type: LabOrderJob["type"];
  sentAt: string;
  stockName: string;
  format: number;
  exposures: number;
}

interface ApiLabOrder {
  id: string;
  labId: string;
  labName: string;
  code: string;
  orderedAt: string;
  dueDate?: string;
  vat: number;
  discount: number;
  notes?: string;
  subtotal: number;
  total: number;
  items: {
    id: string;
    product: string;
    options?: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    unitCost: number;
    jobs: ApiLabOrderJob[];
  }[];
}

const toJob = (job: ApiLabOrderJob): LabOrderJob => ({
  id: job.id,
  rollId: job.rollId,
  type: job.type,
  sentDate: job.sentAt,
  stockName: job.stockName,
  format: job.format,
  exposures: job.exposures,
});

const toOrder = (order: ApiLabOrder): LabOrder => ({
  id: order.id,
  labId: order.labId,
  labName: order.labName,
  code: order.code,
  orderedAt: order.orderedAt,
  dueDate: order.dueDate ?? null,
  vat: order.vat,
  discount: order.discount,
  notes: order.notes ?? "",
  subtotal: order.subtotal,
  total: order.total,
  lines: order.items.map((item) => ({
    id: item.id,
    product: item.product,
    options: item.options ?? "",
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    lineTotal: item.lineTotal,
    unitCost: item.unitCost,
    jobs: item.jobs.map(toJob),
  })),
});

export const labOrderQueries = {
  list: () =>
    queryOptions({
      queryKey: labOrderKeys.list(),
      queryFn: async (): Promise<LabOrder[]> =>
        (await http.get<ApiLabOrder[]>("/lab-orders")).data.map(toOrder),
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: labOrderKeys.detail(id),
      queryFn: async (): Promise<LabOrder> =>
        toOrder((await http.get<ApiLabOrder>(`/lab-orders/${id}`)).data),
    }),
  linkableJobs: (id: string) =>
    queryOptions({
      queryKey: labOrderKeys.linkableJobs(id),
      queryFn: async (): Promise<LabOrderJob[]> =>
        (await http.get<ApiLabOrderJob[]>(`/lab-orders/${id}/linkable-jobs`)).data.map(toJob),
    }),
};

/** The API upserts an order at a client-chosen id, and its lines the same way. */
export const saveLabOrder = async (variables: { id?: string; input: LabOrderInput }) => {
  const id = variables.id ?? crypto.randomUUID();
  const { input } = variables;
  await http.put(`/lab-orders/${id}`, {
    labId: input.labId,
    code: input.code.trim().replace(/^#/, ""),
    orderedAt: input.orderedAt,
    dueDate: input.dueDate || undefined,
    vat: input.vat ?? 0,
    discount: input.discount ?? 0,
    notes: input.notes || undefined,
    items: input.lines.map((line) => ({
      id: line.id,
      product: line.product.trim(),
      options: line.options.trim() || undefined,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
    })),
  });
  return id;
};

export const deleteLabOrder = async (id: string) => {
  await http.delete(`/lab-orders/${id}`);
};

export const addJobToLine = async (variables: { jobId: string; lineId: string }) => {
  await http.put(`/processing/${variables.jobId}/order-item`, { orderItemId: variables.lineId });
};

export const removeJobFromOrder = async (jobId: string) => {
  await http.delete(`/processing/${jobId}/order-item`);
};
