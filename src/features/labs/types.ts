export interface Lab {
  id: string;
  name: string;
  address: string;
  /** Scanners the lab runs, in order; the default, when the lab has one, comes first. */
  scannerIds: string[];
  /** Scanner a job sent to the lab starts with, one of `scannerIds`. */
  defaultScannerId?: string;
}
