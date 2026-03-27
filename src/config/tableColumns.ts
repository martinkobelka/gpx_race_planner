import type { T } from '../i18n/translations';

/**
 * Single source of truth for the segments table columns.
 * Adding or removing a column means editing only this file.
 *
 * Fields:
 *  key           — ColKey used in visibleColumns / columnAlignments Redux state
 *  labelKey      — key in the T translation object for the column header
 *  tooltipKey    — key in the T translation object for the header tooltip
 *  exportField   — key used in the getData() map inside SegmentsTable (TableExportPanel)
 *  alwaysVisible — not toggleable (the '#' id column)
 *  defaultVisible — included in the initial visibleColumns list
 */

export type ColKey =
  | 'fromTo' | 'lengthKm' | 'elev' | 'avgSlope'
  | 'type' | 'pace' | 'segTime' | 'cumTime' | 'avgPace';

export interface ColDef {
  key: ColKey | 'id';
  labelKey: keyof T;
  tooltipKey: keyof T;
  exportField: string;
  alwaysVisible: boolean;
  defaultVisible: boolean;
}

export const SEGMENT_TABLE_COLUMNS: ColDef[] = [
  { key: 'id',       labelKey: 'colNum',     tooltipKey: 'colTipNum',     exportField: 'id',        alwaysVisible: true,  defaultVisible: true  },
  { key: 'fromTo',   labelKey: 'colFromTo',  tooltipKey: 'colTipFromTo',  exportField: 'fromTo',    alwaysVisible: false, defaultVisible: true  },
  { key: 'lengthKm', labelKey: 'colLength',  tooltipKey: 'colTipLength',  exportField: 'lengthKm',  alwaysVisible: false, defaultVisible: true  },
  { key: 'elev',     labelKey: 'colElev',    tooltipKey: 'colTipElev',    exportField: 'elev',      alwaysVisible: false, defaultVisible: true  },
  { key: 'avgSlope', labelKey: 'colSlope',   tooltipKey: 'colTipSlope',   exportField: 'avgSlope',  alwaysVisible: false, defaultVisible: true  },
  { key: 'type',     labelKey: 'colType',    tooltipKey: 'colTipType',    exportField: 'typeLabel', alwaysVisible: false, defaultVisible: true  },
  { key: 'pace',     labelKey: 'colPace',    tooltipKey: 'colTipPace',    exportField: 'pace',      alwaysVisible: false, defaultVisible: true  },
  { key: 'segTime',  labelKey: 'colSegTime', tooltipKey: 'colTipSegTime', exportField: 'segTime',   alwaysVisible: false, defaultVisible: true  },
  { key: 'cumTime',  labelKey: 'colCumTime', tooltipKey: 'colTipCumTime', exportField: 'cumTime',   alwaysVisible: false, defaultVisible: true  },
  { key: 'avgPace',  labelKey: 'colAvgPace', tooltipKey: 'colTipAvgPace', exportField: 'avgPace',   alwaysVisible: false, defaultVisible: false },
];

/** Keys of toggleable columns (excludes always-visible 'id'). */
export const ALL_COL_KEYS = SEGMENT_TABLE_COLUMNS
  .filter(c => !c.alwaysVisible)
  .map(c => c.key) as ColKey[];

/** Default value for settingsSlice.visibleColumns. */
export const DEFAULT_VISIBLE_COLS = SEGMENT_TABLE_COLUMNS
  .filter(c => !c.alwaysVisible && c.defaultVisible)
  .map(c => c.key as string);
