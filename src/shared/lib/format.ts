// Pure formatting helpers: no store access, safe to use anywhere.

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const daysSince = (iso: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0;

const pad = (value: number) => String(value).padStart(2, "0");

/**
 * A date as dd/mm/yyyy. Takes an ISO date ("2026-10-11"), read as a calendar day so the time
 * zone cannot shift it, or an ISO date-time, shown in local time.
 */
export const formatDate = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (day) return `${day[3]}/${day[2]}/${day[1]}`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
};

/** An ISO date-time as dd/mm/yyyy HH:mm in local time. */
export const formatDateTime = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : `${formatDate(iso)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

export const formatVnd = (amount: number | null | undefined) =>
  amount == null ? "—" : `${new Intl.NumberFormat("vi-VN").format(amount)} ₫`;

/** One-line plain text from Markdown notes, for table cells and other tight spots. */
export const plainText = (markdown: string) => {
  const escaped: string[] = [];
  return (
    markdown
      // park escaped characters so the rules below leave them alone
      .replace(
        /\\([\\`*_{}[\]()#+\-.!>~|])/g,
        (_, char: string) => `\uE000${escaped.push(char) - 1}\uE000`,
      )
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/(?<![\w\\])(\*\*|__|~~|`|\*|_)(?=\S)(.+?)(?<=\S)\1(?!\w)/g, "$2")
      .replace(/\uE000(\d+)\uE000/g, (_, index: string) => escaped[Number(index)]!)
      .replace(/\s+/g, " ")
      .trim()
  );
};
