import React, { useCallback, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { parseGpx } from '../services/gpxService';
import { setRawData, resetGpx } from '../store/gpxSlice';
import { resetSegments, setSmoothingWindow, setSlopeThreshold, setMinSegmentLength } from '../store/segmentsSlice';
import { resetResults, setIsCalculating } from '../store/resultsSlice';
import type { AppDispatch } from '../store';
import HelpIcon from './HelpIcon';
import CollapsibleCard from './CollapsibleCard';
import { useGpxData } from '../hooks/useGpxData';
import { useSegmentData } from '../hooks/useSegmentData';
import { useT } from '../i18n/useT';
import samples from '../samples.json';

const GpxUploader: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { fileName } = useGpxData();
  const { slopeThreshold, minSegmentLength, smoothingWindow } = useSegmentData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  const processGpxText = useCallback(
    (text: string, name: string) => {
      dispatch(setRawData({ fileName: name, rawPoints: parseGpx(text) }));
    },
    [dispatch]
  );

  const processFile = useCallback(
    (file: File) => {
      if (!file.name.toLowerCase().endsWith('.gpx')) {
        alert('Prosím nahrajte soubor ve formátu .gpx');
        return;
      }
      setLoading(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          processGpxText(e.target?.result as string, file.name);
        } catch (err) {
          alert('Chyba při čtení GPX souboru: ' + (err as Error).message);
        } finally {
          setLoading(false);
        }
      };
      reader.onerror = () => setLoading(false);
      reader.readAsText(file);
    },
    [processGpxText]
  );

  const loadSample = useCallback(
    async (sample: { file: string; nameKey: string }, label: string) => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}samples/${sample.file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        processGpxText(await res.text(), label);
      } catch (err) {
        alert('Chyba při načítání vzorové trasy: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    },
    [processGpxText]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDragOver  = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false); };
  const handleDrop      = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); const file = e.dataTransfer.files?.[0]; if (file) processFile(file); };
  const handleReset     = () => { dispatch(resetGpx()); dispatch(resetSegments()); dispatch(resetResults()); };

  return (
    <CollapsibleCard title={t.gpxCard} className="mb-3">
      {fileName ? (
        <div>
          <div className="flex align-items-center gap-2 mb-3">
            <i className="pi pi-map file-icon" />
            <span className="file-name">{fileName}</span>
            <Button label={t.remove} icon="pi pi-trash" severity="danger" size="small" outlined onClick={handleReset} className="ml-auto" />
          </div>
          <div className="gpx-params">
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.smoothing}
                <HelpIcon id="help-smoothing" text={t.helpSmoothing} />
              </label>
              <InputNumber value={smoothingWindow} onValueChange={(e) => { dispatch(setIsCalculating(true)); dispatch(setSmoothingWindow(e.value ?? 7)); }} min={1} max={50} showButtons />
            </div>
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.slopeThreshold}
                <HelpIcon id="help-slope" text={t.helpSlope} />
              </label>
              <InputNumber value={slopeThreshold} onValueChange={(e) => { dispatch(setIsCalculating(true)); dispatch(setSlopeThreshold(e.value ?? 5)); }} min={1} max={50} step={1} minFractionDigits={0} maxFractionDigits={0} suffix=" m/km" showButtons />
            </div>
            <div className="gpx-param">
              <label className="block mb-1 text-sm font-medium gpx-param__label">
                {t.minLength}
                <HelpIcon id="help-minlen" text={t.helpMinLen} />
              </label>
              <InputNumber value={minSegmentLength} onValueChange={(e) => { dispatch(setIsCalculating(true)); dispatch(setMinSegmentLength(e.value ?? 100)); }} min={50} max={2000} step={50} showButtons />
            </div>
          </div>
        </div>
      ) : (
        <>
          <input ref={fileInputRef} type="file" accept=".gpx" className="fit-export-hidden" onChange={handleFileInput} />
          {loading && (
            <div className="gpx-loading">
              <i className="pi pi-spin pi-spinner gpx-loading__icon" />
              <span>{t.gpxLoading}</span>
            </div>
          )}
          {!loading && (<>
          <Dropdown
            options={samples.map((s) => ({ label: t[s.nameKey as keyof typeof t] as string, value: s.file }))}
            onChange={(e) => {
              const s = samples.find(x => x.file === e.value);
              if (s) loadSample(s, t[s.nameKey as keyof typeof t] as string);
            }}
            placeholder={t.sampleRoutes}
            className="sample-routes-dropdown"
            filter
          />
          <div
            className={`drop-zone${dragging ? ' drop-zone--dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <i className={`pi pi-upload drop-zone__icon${dragging ? ' drop-zone__icon--dragging' : ''}`} />
            <div className={`drop-zone__title${dragging ? ' drop-zone__title--dragging' : ''}`}>
              {dragging ? t.dropZoneActive : t.dropZoneTitle}
            </div>
            <div className="drop-zone__hint">{t.dropZoneHint}</div>
          </div>
          </>)}
        </>
      )}
    </CollapsibleCard>
  );
};

export default GpxUploader;
