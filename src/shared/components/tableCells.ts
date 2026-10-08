import type { RowData } from "@tanstack/vue-table";
import { h, type VNodeChild } from "vue";
import { cn } from "#/shared/lib/utils";
import { Button } from "#/shared/ui/button";
import type { DataTableColumn } from "./dataTable";

/**
 * Cell renderers shared by every list table, so all tables read the same way:
 * a bold name with a muted line under it, small bordered tags, and Edit/Delete on the right.
 */

/** The row's name (pass it to a `Link` as `class` when the row has a detail page). */
export const PRIMARY_TEXT = "font-heading text-[0.95rem] font-semibold";
export const PRIMARY_LINK = `${PRIMARY_TEXT} hover:underline`;

export const primaryText = (text: string) => h("span", { class: PRIMARY_TEXT }, text);

/** A main line with an optional muted detail line under it. */
export const stackCell = (main: VNodeChild, detail?: string | null) =>
  h("div", { class: "grid gap-0.5" }, [
    main,
    detail ? h("span", { class: "text-muted-foreground text-xs" }, detail) : null,
  ]);

/** A short value in a bordered tag, such as a format or mount; `tone` swaps the colours. */
export const tagCell = (text: string, tone?: string) =>
  h(
    "span",
    {
      class: cn(
        "bg-muted inline-flex h-7 items-center rounded-md border px-2.5 text-xs whitespace-nowrap",
        tone,
      ),
    },
    text,
  );

export const mutedCell = (text: string | null | undefined) =>
  h("span", { class: "text-muted-foreground" }, text || "—");

export const numberCell = (text: string | number | null | undefined) =>
  h("span", { class: "tabular-nums" }, text == null || text === "" ? "—" : String(text));

interface RowActions {
  onEdit?: () => void;
  /** Omit to hide Delete (for example a built-in lens); its space is kept. */
  onDelete?: () => void;
  deleteDisabled?: boolean;
}

/** The trailing Actions column: Edit (outline) and Delete (quiet). */
export function actionsColumn<T extends RowData>(
  actions: (row: T) => RowActions,
): DataTableColumn<T> {
  return {
    id: "actions",
    header: "Actions",
    enableSorting: false,
    enableGlobalFilter: false,
    meta: { align: "right" },
    cell: ({ row }) => {
      const a = actions(row.original);
      return h("div", { class: "inline-flex items-center gap-1" }, [
        a.onEdit
          ? h(
              Button,
              { size: "sm", variant: "outline", class: "bg-card px-3.5", onClick: a.onEdit },
              () => "Edit",
            )
          : null,
        // without Delete, an invisible copy keeps Edit lined up with the other rows
        h(
          Button,
          {
            size: "sm",
            variant: "ghost",
            class: cn(
              "text-muted-foreground hover:text-destructive px-2",
              !a.onDelete && "invisible",
            ),
            disabled: a.deleteDisabled || !a.onDelete,
            "aria-hidden": a.onDelete ? undefined : "true",
            tabindex: a.onDelete ? undefined : -1,
            onClick: a.onDelete,
          },
          () => "Delete",
        ),
      ]);
    },
  };
}
