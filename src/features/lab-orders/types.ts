import type { ProcessingType } from "#/features/rolls/types";

/** A processing job and the roll it works on. */
export interface LabOrderJob {
  id: string;
  rollId: string;
  type: ProcessingType;
  sentDate: string;
  stockName: string;
  format: number;
  exposures: number;
}

export interface LabOrderLine {
  id: string;
  product: string;
  /** The services the lab lists under the product. */
  options: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** What a roll on this line costs, with the order's VAT and discount shared out. */
  unitCost: number;
  jobs: LabOrderJob[];
}

export interface LabOrder {
  id: string;
  labId: string;
  labName: string;
  code: string;
  orderedAt: string;
  dueDate: string | null;
  vat: number;
  discount: number;
  notes: string;
  subtotal: number;
  total: number;
  lines: LabOrderLine[];
}

/** A line as the form edits it. */
export interface LabOrderLineInput {
  id: string;
  product: string;
  options: string;
  quantity: number;
  unitPrice: number;
}

export interface LabOrderInput {
  labId: string;
  code: string;
  /** ISO date-time. */
  orderedAt: string;
  dueDate?: string;
  vat?: number;
  discount?: number;
  notes?: string;
  lines: LabOrderLineInput[];
}

/** A job that can go on an order, with the lines of that order it is already on. */
export interface LinkableJob extends LabOrderJob {
  lineIds: string[];
}

/** Rolls still to come on a line. */
export const roomOnLine = (line: LabOrderLine) => line.quantity - line.jobs.length;

/** Every job on the order once, with the lines that bill it: one roll can be on several. */
export const jobsOnOrder = (order: LabOrder) => {
  const byJob = new Map<string, { job: LabOrderJob; lines: LabOrderLine[] }>();
  for (const line of order.lines)
    for (const job of line.jobs) {
      const entry = byJob.get(job.id) ?? { job, lines: [] };
      entry.lines.push(line);
      byJob.set(job.id, entry);
    }
  return [...byJob.values()];
};

/** Rolls on the order, and how many of the places its lines bill are taken. */
export const rollsOnOrder = (order: LabOrder) => ({
  rolls: new Set(jobsOnOrder(order).map(({ job }) => job.rollId)).size,
  taken: order.lines.reduce((sum, line) => sum + line.jobs.length, 0),
  billed: order.lines.reduce((sum, line) => sum + line.quantity, 0),
});
