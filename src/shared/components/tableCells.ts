import { h, type VNodeChild } from 'vue';

import { cn } from '#/shared/lib/utils';

/**
 * Cell renderers shared by every list table, so all tables read the same way:
 * a bold name with a muted line under it and small bordered tags. A row opens its record
 * (DataTable `onSelect`); Edit and Delete live on the detail page or edit dialog.
 */

/** The row's name (pass it to a `Link` as `class` when the row has a detail page). */
export const PRIMARY_TEXT = 'font-heading text-[0.95rem] font-semibold';
export const PRIMARY_LINK = `${PRIMARY_TEXT} focus-visible:underline outline-none`;

export const primaryText = (text: string) => h('span', { class: PRIMARY_TEXT }, text);

/** A main line with an optional muted detail line under it. */
export const stackCell = (main: VNodeChild, detail?: string | null) =>
  h('div', { class: 'grid gap-0.5' }, [
    main,
    // cells never wrap, so a long detail (a roll's notes) is cut to one line; hover shows all of it
    detail
      ? h(
          'span',
          { class: 'text-muted-foreground max-w-80 truncate text-xs', title: detail },
          detail,
        )
      : null,
  ]);

/** A short value in a bordered tag, such as a format or mount; `tone` swaps the colours. */
export const tagCell = (text: string, tone?: string) =>
  h(
    'span',
    {
      class: cn(
        'inline-flex h-7 items-center rounded-md border bg-muted px-2.5 text-xs whitespace-nowrap',
        tone,
      ),
    },
    text,
  );

export const mutedCell = (text: string | null | undefined) =>
  h('span', { class: 'text-muted-foreground' }, text || '—');

export const numberCell = (text: string | number | null | undefined) =>
  h('span', { class: 'tabular-nums' }, text == null || text === '' ? '—' : String(text));
