import React, { useEffect, useRef, useState } from 'react';
import TableExportPanel from './TableExportPanel';
import { useDispatch } from 'react-redux';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Dialog } from 'primereact/dialog';
import type { AppDispatch } from '../store';
import { setVisibleColumns, setColumnAlignment } from '../store/settingsSlice';
import type { ColAlignment } from '../store/settingsSlice';
import CollapsibleCard from './CollapsibleCard';
import { useSegmentData } from '../hooks/useSegmentData';
import { useResults } from '../hooks/useResults';
import { useAppSettings } from '../hooks/useAppSettings';
import type { SegmentType } from '../types';
import { TYPE_SEVERITY } from '../types';
import { segmentToRow } from '../services/segmentRowService';
import type { RowData } from '../services/segmentRowService';
import { useT } from '../i18n/useT';
import { useHoveredSegment } from '../hooks/useHoveredSegment';
import { SEGMENT_TABLE_COLUMNS, ALL_COL_KEYS } from '../config/tableColumns';
import type { ColKey } from '../config/tableColumns';


const SegmentsTable: React.FC = () => {
  const t = useT();
  const dispatch = useDispatch<AppDispatch>();
  const { hoveredId, setHoveredId } = useHoveredSegment();
  const tableRef = useRef<DataTable<RowData[]>>(null);
  const tableSettingsRef = useRef<OverlayPanel>(null);
  const [exportVisible, setExportVisible] = useState(false);
  const { segments } = useSegmentData();
  const { segmentResults } = useResults();
  const { targetPaceSeconds, visibleColumns, columnAlignments } = useAppSettings();
  const align = (field: string): ColAlignment => (columnAlignments ?? {})[field] ?? 'left';
  const visibleCols = (visibleColumns ?? ALL_COL_KEYS) as ColKey[];

  useEffect(() => {
    if (hoveredId === null || !tableRef.current) return;

    const tableElement = tableRef.current.getElement();
    if (!tableElement) return;

    if (tableElement.matches(':hover')) return;

    const scrollContainer = tableElement.querySelector('.p-datatable-wrapper') as HTMLElement;
    if (!scrollContainer) return;

    const hoveredRow = scrollContainer.querySelector('.segment-row-hovered') as HTMLElement;
    if (!hoveredRow) return;

    const rowRect = hoveredRow.getBoundingClientRect();
    const containerRect = scrollContainer.getBoundingClientRect();

    const rowTop = rowRect.top - containerRect.top + scrollContainer.scrollTop;
    const oneThirdHeight = scrollContainer.clientHeight / 2;
    const targetScrollTop = Math.max(0, rowTop - oneThirdHeight);

    scrollContainer.scrollTo({ top: targetScrollTop, behavior: 'smooth' });
  }, [hoveredId]);

  if (segments.length === 0) return null;

  const vis = (k: ColKey) => visibleCols.includes(k);

  const colOptions = SEGMENT_TABLE_COLUMNS
    .filter(c => !c.alwaysVisible)
    .map(c => ({ label: t[c.labelKey] as string, value: c.key as ColKey }));

  const typeLabels: Record<SegmentType, string> = {
    uphill: t.typeUphill,
    downhill: t.typeDownhill,
    flat: t.typeFlat,
  };

  const rows: RowData[] = segments.map((seg, idx) =>
    segmentToRow(seg, idx, segmentResults, targetPaceSeconds, typeLabels)
  );

  return (
    <>
      <CollapsibleCard
        title={t.segCardTitle(segments.length)}
        className="mb-3"
        fullscreenEnabled
        headerExtra={() => (
          <>
            <Button
              icon="pi pi-cog"
              text rounded
              className="collapsible-card-btn"
              tooltip={t.tableSettingsLabel}
              tooltipOptions={{ position: 'bottom' }}
              onClick={(e) => tableSettingsRef.current?.toggle(e)}
            />
            <Button
              icon="pi pi-download"
              text rounded
              className="collapsible-card-btn"
              tooltip={t.tableExportLabel}
              tooltipOptions={{ position: 'bottom' }}
              onClick={() => setExportVisible(true)}
            />
          </>
        )}
      >
        {(() => {
          const colStyle = (field: string): React.CSSProperties => ({ textAlign: align(field), whiteSpace: 'nowrap' });
          const headStyle = (field: string): React.CSSProperties => ({ textAlign: align(field) });
          const columns = [
            <Column key="id" field="id" header={t.colNum} headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipNum} style={{ width: '3rem', ...colStyle('id') }} headerStyle={headStyle('id')} />,
          ];
          if (vis('fromTo'))   columns.push(<Column key="fromTo"   field="fromTo"   header={t.colFromTo}  headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipFromTo}  style={colStyle('fromTo')}   headerStyle={headStyle('fromTo')} />);
          if (vis('lengthKm')) columns.push(<Column key="lengthKm" field="lengthKm" header={t.colLength}  headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipLength}  style={colStyle('lengthKm')} headerStyle={headStyle('lengthKm')} />);
          if (vis('elev'))     columns.push(<Column key="elev"     field="elevGain"  header={t.colElev}   headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipElev}    style={colStyle('elev')}     headerStyle={headStyle('elev')} body={(r: RowData) => (
            <span style={{ display: 'flex', justifyContent: align('elev') === 'right' ? 'flex-end' : align('elev') === 'center' ? 'center' : 'flex-start', gap: '0.25rem' }}>
              {r.elevGain > 0 && <span className="text-uphill">+{r.elevGain} m</span>}
              {r.elevLoss > 0 && <span className="text-downhill">-{r.elevLoss} m</span>}
              {r.elevGain === 0 && r.elevLoss === 0 && '—'}
            </span>
          )} />);
          if (vis('avgSlope')) columns.push(<Column key="avgSlope" field="avgSlope"  header={t.colSlope}  headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipSlope}   style={colStyle('avgSlope')} headerStyle={headStyle('avgSlope')} body={(r: RowData) => {
            const v = parseFloat(r.avgSlope);
            const cls = v > 0 ? 'text-uphill slope-value' : v < 0 ? 'text-downhill slope-value' : 'text-neutral slope-value';
            return <span className={cls} style={{ display: 'block', textAlign: align('avgSlope') }}>{r.avgSlope}%</span>;
          }} />);
          if (vis('type'))     columns.push(<Column key="type"     field="typeLabel" header={t.colType}   headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipType}    style={colStyle('type')}     headerStyle={headStyle('type')} body={(r: RowData) => <Tag value={r.typeLabel} severity={TYPE_SEVERITY[r.type]} />} />);
          if (vis('pace'))     columns.push(<Column key="pace"     field="pace"      header={t.colPace}   headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipPace}    style={colStyle('pace')}     headerStyle={headStyle('pace')} />);
          if (vis('segTime'))  columns.push(<Column key="segTime"  field="segTime"   header={t.colSegTime} headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipSegTime} style={colStyle('segTime')} headerStyle={headStyle('segTime')} />);
          if (vis('cumTime'))  columns.push(<Column key="cumTime"  field="cumTime"   header={t.colCumTime} headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipCumTime} style={colStyle('cumTime')} headerStyle={headStyle('cumTime')} />);
          if (vis('avgPace'))  columns.push(<Column key="avgPace"  field="avgPace"   header={t.colAvgPace} headerTooltipOptions={{ position: 'bottom' }} headerTooltip={t.colTipAvgPace} style={colStyle('avgPace')} headerStyle={headStyle('avgPace')} />);
          return (
            <DataTable
              key={visibleCols.join(',') + JSON.stringify(columnAlignments ?? {})}
              ref={tableRef}
              value={rows}
              size="small"
              scrollable
              scrollHeight="400px"
              rowClassName={(row: RowData) => hoveredId === row.id ? 'segment-row-hovered' : ''}
              onRowMouseEnter={(e) => setHoveredId((e.data as RowData).id)}
              onRowMouseLeave={() => setHoveredId(null)}
            >
              {columns}
            </DataTable>
          );
        })()}
      </CollapsibleCard>
      <Dialog
        header={t.tableExportLabel}
        visible={exportVisible}
        onHide={() => setExportVisible(false)}
        className="export-dialog"
      >
        <TableExportPanel
          columns={SEGMENT_TABLE_COLUMNS.map(c => ({ field: c.exportField, label: t[c.labelKey] as string }))}
          getData={(fields) => rows.map(r => {
            const map: Record<string, string | number> = {
              id: r.id,
              fromTo: r.fromTo,
              lengthKm: r.lengthKm,
              elev: r.elevGain > 0 ? `+${r.elevGain}` : r.elevLoss > 0 ? `-${r.elevLoss}` : '0',
              avgSlope: `${r.avgSlope}%`,
              typeLabel: r.typeLabel,
              pace: r.pace,
              segTime: r.segTime,
              cumTime: r.cumTime,
              avgPace: r.avgPace,
            };
            return fields.map(f => map[f] ?? '');
          })}
          onClose={() => setExportVisible(false)}
        />
      </Dialog>
      <OverlayPanel ref={tableSettingsRef}>
        {/* Visible columns */}
        <div className="text-sm font-semibold mb-2">{t.colColumns}</div>
        <MultiSelect
          value={visibleCols}
          options={colOptions}
          optionValue="value"
          onChange={(e) => dispatch(setVisibleColumns(e.value))}
          maxSelectedLabels={0}
          selectedItemsLabel={t.colColumns}
          className="col-selector mb-3"
        />

        {/* Column alignment */}
        <div className="text-sm font-semibold mb-2">{t.colAlignmentLabel}</div>
        {SEGMENT_TABLE_COLUMNS
          .filter(c => c.alwaysVisible || visibleCols.includes(c.key as ColKey))
          .map(c => ({ field: c.key as string, label: t[c.labelKey] as string }))
          .map(({ field, label }) => (
          <div key={field} className="col-align-row">
            <span className="text-sm">{label}</span>
            <div className="col-align-btns">
              {(['left', 'center', 'right'] as ColAlignment[]).map((a) => (
                <Button
                  key={a}
                  icon={`pi pi-align-${a}`}
                  size="small"
                  outlined={align(field) !== a}
                  onClick={() => dispatch(setColumnAlignment({ field, align: a }))}
                  className="col-align-btn"
                />
              ))}
            </div>
          </div>
        ))}
      </OverlayPanel>
    </>
  );
};

export default SegmentsTable;
