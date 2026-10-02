import { Fragment, createElement, type ReactNode } from 'react';

/**
 * Off-platform replacement for Airo's '@airo/content' package.
 * In Airo this wrapper only tagged list fields for the visual editor;
 * outside Airo it simply renders its children.
 */
export function ContentListContext({ children }: { field?: string; children?: ReactNode }) {
  return createElement(Fragment, null, children);
}
