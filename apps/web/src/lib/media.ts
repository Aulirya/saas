// Centralized media query utilities for consistent breakpoints across the app
// Usage examples:
//   import { media, mq, breakpoints } from '@/lib/media'
//
//   // As raw strings (e.g., inline styles or libraries that accept media queries):
//   const query = media.up.md // -> '(min-width: 768px)'
//
//   // In CSS-in-JS (e.g., vanilla-extract, emotion, styled-components):
//   const card = {
//     width: '100%',
//     [`@media ${media.up.lg}`]: { width: 800 },
//   }
//
//   // Programmatic helpers:
//   mq.up('md')    // -> '(min-width: 768px)'
//   mq.down('lg')  // -> '(max-width: 1023.98px)'
//   mq.between('sm', 'lg') // -> '(min-width: 640px) and (max-width: 1023.98px)'

export type BreakpointKey = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

export const breakpoints: Record<BreakpointKey, number> = {
    xs: 480,
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    "2xl": 1536,
};

const maxWidth = (px: number) => `${px - 0.02}px`; // guard overlap by a hair

const up = (key: BreakpointKey) => `(min-width: ${breakpoints[key]}px)`;
const down = (key: BreakpointKey) => {
    return `(max-width: ${maxWidth(breakpoints[key])})`;
};
const between = (minKey: BreakpointKey, maxKey: BreakpointKey) => {
    return `(min-width: ${breakpoints[minKey]}px) and (max-width: ${maxWidth(
        breakpoints[maxKey]
    )})`;
};

export const mq = {
    up,
    down,
    between,
};

export const media = {
    up: {
        xs: up("xs"),
        sm: up("sm"),
        md: up("md"),
        lg: up("lg"),
        xl: up("xl"),
        "2xl": up("2xl"),
    },
    down: {
        xs: down("xs"),
        sm: down("sm"),
        md: down("md"),
        lg: down("lg"),
        xl: down("xl"),
        "2xl": down("2xl"),
    },
    between: {
        xs_sm: between("xs", "sm"),
        sm_md: between("sm", "md"),
        md_lg: between("md", "lg"),
        lg_xl: between("lg", "xl"),
        xl_2xl: between("xl", "2xl"),
    },
};

export default media;
