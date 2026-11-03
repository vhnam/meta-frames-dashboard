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

/** Rolls still to come on a line. */
export const roomOnLine = (line: LabOrderLine) => line.quantity - line.jobs.length;

/** Rolls on the order, against the rolls it bills. */
export const rollsOnOrder = (order: LabOrder) => ({
  taken: order.lines.reduce((sum, line) => sum + line.jobs.length, 0),
  billed: order.lines.reduce((sum, line) => sum + line.quantity, 0),
});
