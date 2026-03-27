/**
 * Table export dialog content.
 * Lets the user pick a format, configure columns and advanced options, then download.
 *
 * State is grouped by format section and passed to subcomponents as typed objects
 * with partial-update callbacks, so each child only touches what it owns.
 */

import React, { useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { useT } from '../../i18n/useT';
import ColumnSelector from './ColumnSelector';
import AdvancedSettings from './AdvancedSettings';
import {
  downloadXlsx, downloadCsv, downloadJson, downloadXml, downloadHtml, downloadPdf,
  getExtension,
} from './downloadLogic';
import type {
  Format, ExportColumn, TableExportPanelProps,
  CsvOptions, TextOptions, XlsxOptions, XmlOptions, HtmlOptions, PdfOptions,
} from './types';

export type { ExportColumn };

// ── Default state values ──────────────────────────────────────────────────────

const DEFAULT_CSV:  CsvOptions  = { delimiter: ';', bom: true };
const DEFAULT_TEXT: TextOptions = { lineEnding: 'crlf', encoding: 'UTF-8', decimal: ',' };
const DEFAULT_XLSX: XlsxOptions = { sheetName: 'Pace plan' };
const DEFAULT_XML:  XmlOptions  = { xmlRoot: 'pace-plan', xmlRow: 'segment' };
const DEFAULT_HTML: HtmlOptions = { htmlTitle: 'Pace plan', htmlStyles: true };
const DEFAULT_PDF:  PdfOptions  = {
  orientation: 'portrait', paperSize: 'a4', title: 'Pace plan',
  marginTop: 10, marginBottom: 10, marginLeft: 10, marginRight: 10,
  headerEnabled: false, headerShowTitle: true, headerShowDate: true,
  footerEnabled: false, footerShowPageNum: true,
  fitToPage: false,
};

// ── Component ─────────────────────────────────────────────────────────────────

const TableExportPanel: React.FC<TableExportPanelProps> = ({ columns, getData }) => {
  const t = useT();

  // ── Top-level state ────────────────────────────────────────────────────────
  const [format,   setFormat]   = useState<Format>('xlsx');
  const [filename, setFilename] = useState('pace-plan');
  const [selected, setSelected] = useState<ExportColumn[]>(columns);

  // ── Format-specific option groups ──────────────────────────────────────────
  const [csv,  setCsv]  = useState<CsvOptions>(DEFAULT_CSV);
  const [text, setText] = useState<TextOptions>(DEFAULT_TEXT);
  const [xlsx, setXlsx] = useState<XlsxOptions>(DEFAULT_XLSX);
  const [xml,  setXml]  = useState<XmlOptions>(DEFAULT_XML);
  const [html, setHtml] = useState<HtmlOptions>(DEFAULT_HTML);
  const [pdf,  setPdf]  = useState<PdfOptions>(DEFAULT_PDF);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [downloadedFile, setDownloadedFile] = useState<string | null>(null);
  const [downloading,    setDownloading]    = useState(false);

  // ── Format option list ─────────────────────────────────────────────────────
  const formatOptions: { label: string; value: Format }[] = [
    { label: 'XLSX',            value: 'xlsx' },
    { label: t.tableExportCsv,  value: 'csv'  },
    { label: t.tableExportJson, value: 'json' },
    { label: t.tableExportXml,  value: 'xml'  },
    { label: t.tableExportHtml, value: 'html' },
    { label: t.tableExportPdf,  value: 'pdf'  },
  ];

  // ── Download handler ───────────────────────────────────────────────────────
  const handleDownload = async () => {
    const file   = filename || 'export';
    const fields = selected.map(c => c.field);
    const heads  = selected.map(c => c.label);
    const rows   = getData(fields);

    switch (format) {
      case 'xlsx': downloadXlsx(heads, rows, file, xlsx.sheetName); break;
      case 'csv':  downloadCsv(heads, rows, file, csv.delimiter, text.lineEnding, csv.bom, text.decimal); break;
      case 'json': downloadJson(fields, rows, file); break;
      case 'xml':  downloadXml(heads, rows, file, xml.xmlRoot, xml.xmlRow, text.encoding, text.decimal); break;
      case 'html': downloadHtml(heads, rows, file, html.htmlTitle, html.htmlStyles, text.encoding, text.decimal); break;
      case 'pdf':  await downloadPdf(heads, rows, file, pdf); break;
    }

    setDownloadedFile(file + getExtension(format));
  };

  // ── Success view ───────────────────────────────────────────────────────────
  if (downloadedFile) {
    return (
      <div className="flex flex-column align-items-center gap-3 py-3">
        <i className="pi pi-check-circle text-green-500 export-success-icon" />
        <div className="text-xl font-semibold">{t.tableExportSuccessTitle}</div>
        <div className="text-sm text-color-secondary">{t.tableExportSuccessDesc(downloadedFile)}</div>
        <div className="flex gap-2 mt-2">
          <Button label={t.tableExportNewExport} icon="pi pi-plus" severity="secondary" onClick={() => setDownloadedFile(null)} />
        </div>
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────────────────────
  return (
    <div className="table-export-form flex flex-column gap-3">

      {/* Format */}
      <div>
        <div className="text-sm mb-1">{t.tableExportFormat}</div>
        <Dropdown value={format} options={formatOptions} onChange={(e) => setFormat(e.value as Format)} className="w-full" appendTo="self" />
      </div>

      {/* Filename */}
      <div>
        <div className="text-sm mb-1">{t.tableExportFilename}</div>
        <div className="p-inputgroup">
          <InputText value={filename} onChange={(e) => setFilename(e.target.value)} className="w-full" />
          <span className="p-inputgroup-addon">{getExtension(format)}</span>
        </div>
      </div>

      {/* Column selector */}
      <ColumnSelector allColumns={columns} selected={selected} onChange={setSelected} />

      {/* Advanced settings */}
      <AdvancedSettings
        format={format}
        csv={csv}   onCsvChange={(u)  => setCsv(prev  => ({ ...prev,  ...u }))}
        text={text} onTextChange={(u) => setText(prev => ({ ...prev, ...u }))}
        xlsx={xlsx} onXlsxChange={(u) => setXlsx(prev => ({ ...prev, ...u }))}
        xml={xml}   onXmlChange={(u)  => setXml(prev  => ({ ...prev,  ...u }))}
        html={html} onHtmlChange={(u) => setHtml(prev => ({ ...prev, ...u }))}
        pdf={pdf}   onPdfChange={(u)  => setPdf(prev  => ({ ...prev,  ...u }))}
      />

      {/* Download button */}
      <Button
        label={t.tableExportDownload}
        icon={downloading ? 'pi pi-spin pi-spinner' : 'pi pi-download'}
        onClick={() => { setDownloading(true); handleDownload().finally(() => setDownloading(false)); }}
        disabled={selected.length === 0 || downloading}
        className="w-full"
      />
    </div>
  );
};

export default TableExportPanel;
