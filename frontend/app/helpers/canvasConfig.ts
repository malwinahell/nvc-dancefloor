// ── Canvas configuration ─────────────────────────────────────────────────────
// Edit CELL_SIZE and TILE_PADDING. Everything else derives automatically.

/** Horizontal snap step (px). One tile spans 2 cells wide. */
export const CELL_SIZE = 150;

/** Gap between adjacent tiles on the same row (px). */
export const TILE_PADDING = 30;

/**
 * Tile width (px) — derived.
 * TILE_WIDTH = 2 × CELL_SIZE − TILE_PADDING = 270 px
 */
export const TILE_WIDTH = 2 * CELL_SIZE - TILE_PADDING;

/**
 * Tile height (px) — derived.
 * TILE_HEIGHT = CELL_SIZE − TILE_PADDING = 120 px
 * One tile spans 1 cell vertically with equal gaps on top/bottom.
 */
export const TILE_HEIGHT = CELL_SIZE - TILE_PADDING;
