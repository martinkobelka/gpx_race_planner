/**
 * Collapsible panel for selecting and reordering export columns.
 * Supports drag-and-drop reordering and per-column removal.
 */

import React, { useRef, useState } from 'react';
import { MultiSelect } from 'primereact/multiselect';
import { Button } from 'primereact/button';
import { Panel } from 'primereact/panel';
import { Message } from 'primereact/message';
import { useT } from '../../i18n/useT';
import type { ExportColumn } from './types';

interface Props {
  allColumns: ExportColumn[];
  selected: ExportColumn[];
  onChange: (cols: ExportColumn[]) => void;
}

const ColumnSelector: React.FC<Props> = ({ allColumns, selected, onChange }) => {
  const t = useT();
  const dragItem = useRef<number | null>(null);
  const dragOver = useRef<number | null>(null);
  const [toAdd, setToAdd] = useState<string[]>([]);

  const handleAdd = () => {
    const cols = toAdd.map(f => allColumns.find(c => c.field === f)!).filter(Boolean);
    onChange([...selected, ...cols]);
    setToAdd([]);
  };

  const handleRemove = (field: string) =>
    onChange(selected.filter(c => c.field !== field));

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOver.current !== null && dragItem.current !== dragOver.current) {
      const arr = [...selected];
      const [moved] = arr.splice(dragItem.current, 1);
      arr.splice(dragOver.current, 0, moved);
      onChange(arr);
    }
    dragItem.current = null;
    dragOver.current = null;
  };

  return (
    <Panel header={t.tableExportColumns} toggleable collapsed>
      {/* Add columns */}
      <div className="flex gap-2 align-items-center mb-2">
        <MultiSelect
          value={toAdd}
          options={allColumns.filter(c => !selected.find(s => s.field === c.field))}
          optionLabel="label"
          optionValue="field"
          onChange={(e) => setToAdd(e.value)}
          placeholder={t.tableExportColumnsSelect}
          emptyMessage={t.tableExportColumnsNone}
          emptyFilterMessage={t.tableExportColumnsNone}
          display="chip"
          className="flex-1 column-add-select"
        />
        <Button
          label={t.tableExportColumnsAdd}
          icon="pi pi-plus"
          severity="success"
          size="small"
          className="column-add-btn"
          disabled={toAdd.length === 0}
          onClick={handleAdd}
        />
      </div>

      {selected.length === 0 && (
        <Message severity="warn" text={t.tableExportColumnsEmpty} className="w-full" />
      )}

      {/* Column list with drag-and-drop */}
      {selected.length > 0 && (
        <>
          <div className="flex justify-content-end mb-1">
            <Button
              label={t.tableExportColumnsRemoveAll}
              icon="pi pi-trash"
              severity="danger" text size="small"
              onClick={() => onChange([])}
            />
          </div>
          <div className="column-list">
            {selected.map((col, idx) => (
              <div
                key={col.field}
                draggable
                onDragStart={() => { dragItem.current = idx; }}
                onDragEnter={() => { dragOver.current = idx; }}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => e.preventDefault()}
                className="column-list__item"
              >
                <span className="column-list__label">
                  <i className="pi pi-bars column-list__drag-icon" />
                  <span className="column-list__index">{idx + 1}.</span>
                  {col.label}
                </span>
                <Button icon="pi pi-times" text rounded severity="danger" size="small" onClick={() => handleRemove(col.field)} />
              </div>
            ))}
          </div>
        </>
      )}
    </Panel>
  );
};

export default ColumnSelector;
