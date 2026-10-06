import type { Component } from "vue";
import {
  IconAperture,
  IconArchive,
  IconBuildingStore,
  IconCalendarTime,
  IconCamera,
  IconCameraCog,
  IconMovie,
  IconStack2,
} from "@tabler/icons-vue";

export interface NavItem {
  title: string;
  to: string;
  icon: Component;
  children?: NavItem[];
}
export interface NavSection {
  label: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    label: "Shooting",
    items: [
      { title: "Rolls", to: "/rolls", icon: IconMovie },
      {
        title: "Gear",
        to: "/cameras",
        icon: IconCameraCog,
        children: [
          { title: "Cameras", to: "/cameras", icon: IconCamera },
          { title: "Lenses", to: "/lenses", icon: IconAperture },
        ],
      },
    ],
  },
  {
    label: "Film & Lab",
    items: [
      { title: "Film Stocks", to: "/stocks", icon: IconStack2 },
      { title: "Inventory", to: "/inventory", icon: IconArchive },
      { title: "Expiry", to: "/expiry", icon: IconCalendarTime },
      { title: "Labs", to: "/labs", icon: IconBuildingStore },
    ],
  },
];

const flat = navSections.flatMap((s) => s.items.flatMap((i) => [i, ...(i.children ?? [])]));
const listPaths = new Set(flat.map((i) => i.to));

/** A nav destination that renders a list, such as `/rolls` or `/expiry`. */
export function isListingPath(path: string) {
  return listPaths.has(path);
}

/** Longest listing path that is a strict parent of `path`, such as `/rolls` for a roll detail. */
export function listingPath(path: string) {
  return [...listPaths]
    .filter((to) => path.startsWith(`${to}/`))
    .sort((a, b) => b.length - a.length)[0];
}

/** Title for the current path, matching the longest nav prefix. */
export function titleForPath(path: string) {
  const hit = flat
    .filter((i) => (i.to === "/" ? path === "/" : path === i.to || path.startsWith(i.to + "/")))
    .sort((a, b) => b.to.length - a.to.length)[0];
  return hit?.title ?? "Not found";
}
