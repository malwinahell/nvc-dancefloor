// ── Canvas configuration ─────────────────────────────────────────────────────
// Edit only CELL_SIZE and TILE_PADDING. Everything else derives automatically.

/** Grid snap step (px). One tile occupies 2 cells horizontally. */
export const CELL_SIZE = 100;

/** Gap between adjacent tiles on the same row (px). */
export const TILE_PADDING = 20;

/**
 * Tile width in px — derived, do not edit.
 * Formula: TILE_WIDTH = 2 × CELL_SIZE − TILE_PADDING
 * Default: 2 × 100 − 20 = 180 px
 */
export const TILE_WIDTH = 2 * CELL_SIZE - TILE_PADDING;
