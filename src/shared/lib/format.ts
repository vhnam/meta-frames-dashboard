// Pure formatting helpers: no store access, safe to use anywhere.

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const daysSince = (iso: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0;

export const formatVnd = (n: number | null | undefined) =>
  n == null ? "—" : `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;
