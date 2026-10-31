export interface Lab {
  id: string;
  name: string;
  address: string;
  /** Scanners the lab runs, the default first. */
  scannerIds: string[];
}
