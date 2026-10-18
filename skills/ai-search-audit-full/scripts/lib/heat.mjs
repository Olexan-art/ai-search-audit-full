// The heat behind the page map and the site matrix: findings weighted by severity, so a place with
// one blocking problem reads hotter than one with three low ones. One set of weights for both
// reports, so a page's zones and a site's cells are drawn from the same scale.

/** Each severity's weight. */
export const HEAT_WEIGHT = { blocking: 8, high: 4, medium: 2, low: 1 };

/** The weighted sum of a list of findings ({severity}); `n` counts a finding repeated n times. */
export const heatOf = (items) => items.reduce((s, f) => s + (HEAT_WEIGHT[f.severity] || 0) * (f.n || 1), 0);

/** 0 to 1 against the hottest value, rounded to two places; 0 when nothing is hot. */
export const heatShare = (value, max) => (max > 0 ? Math.round((value / max) * 100) / 100 : 0);
