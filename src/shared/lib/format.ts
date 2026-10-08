// Pure formatting helpers: no store access, safe to use anywhere.

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const daysSince = (iso: string | null) =>
  iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)) : 0;

export const formatVnd = (n: number | null | undefined) =>
  n == null ? "—" : `${new Intl.NumberFormat("vi-VN").format(n)} ₫`;

/** One-line plain text from Markdown notes, for table cells and other tight spots. */
export const plainText = (markdown: string) => {
  const escaped: string[] = [];
  return (
    markdown
      // park escaped characters so the rules below leave them alone
      .replace(
        /\\([\\`*_{}[\]()#+\-.!>~|])/g,
        (_, c: string) => `\uE000${escaped.push(c) - 1}\uE000`,
      )
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/^\s{0,3}(#{1,6}\s+|>\s?|[-*+]\s+|\d+[.)]\s+)/gm, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/(?<![\w\\])(\*\*|__|~~|`|\*|_)(?=\S)(.+?)(?<=\S)\1(?!\w)/g, "$2")
      .replace(/\uE000(\d+)\uE000/g, (_, i: string) => escaped[Number(i)]!)
      .replace(/\s+/g, " ")
      .trim()
  );
};
