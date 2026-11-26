import type { FilmStock, FilmType, Packaging, Process } from './types';

const tone = {
  c41: 'border-transparent bg-process-c41-bg text-process-c41-fg',
  e6: 'border-transparent bg-process-e6-bg text-process-e6-fg',
  ecn2: 'border-transparent bg-process-ecn2-bg text-process-ecn2-fg',
  bw: 'border-transparent bg-process-bw-bg text-process-bw-fg',
  success: 'border-transparent bg-badge-success-bg text-badge-success-fg',
  warning: 'border-transparent bg-badge-warning-bg text-badge-warning-fg',
} as const;

export const TYPE_TONE: Record<FilmType, string> = {
  color: tone.c41,
  bw: tone.bw,
  slide: tone.e6,
};

export const PROCESS_TONE: Record<Process, string> = {
  'C-41': tone.c41,
  'E-6': tone.e6,
  BW: tone.bw,
  'ECN-2': tone.ecn2,
};

export const PACKAGING_TONE: Record<Packaging, string> = {
  factory: tone.success,
  repack: tone.warning,
  respooled: tone.ecn2,
};

/** What each process is: "C-41" reads as "Color negative". */
export const PROCESS_NAMES: Record<Process, string> = {
  'C-41': 'Color negative',
  'E-6': 'Color reversal',
  BW: 'Black & white',
  'ECN-2': 'Motion picture',
};

export const stockName = (stock: Pick<FilmStock, 'brand' | 'name'> | undefined) =>
  stock ? `${stock.brand} ${stock.name}` : '—';

export function stockWarnings(stock: Pick<FilmStock, 'type' | 'process'>): string[] {
  const out: string[] = [];
  if (stock.type === 'bw' && stock.process !== 'BW') out.push('B&W film usually uses process BW.');
  if (stock.type === 'slide' && stock.process !== 'E-6')
    out.push('Slide film usually uses process E-6.');
  return out;
}
