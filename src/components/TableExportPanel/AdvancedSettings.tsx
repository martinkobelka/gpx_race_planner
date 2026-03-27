/**
 * Collapsible "Advanced settings" panel.
 * Renders format-specific controls based on the currently selected format.
 * Each format's state is passed as a typed object with a partial-update callback.
 */

import React from 'react';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputSwitch } from 'primereact/inputswitch';
import { Panel } from 'primereact/panel';
import { useT } from '../../i18n/useT';
import PdfMarginEditor from './PdfMarginEditor';
import type {
  Format, LineEnding, PdfOrientation, PdfPaperSize,
  CsvOptions, TextOptions, XlsxOptions, XmlOptions, HtmlOptions, PdfOptions,
} from './types';

interface Props {
  format: Format;
  csv:  CsvOptions;  onCsvChange:  (u: Partial<CsvOptions>)  => void;
  text: TextOptions; onTextChange: (u: Partial<TextOptions>) => void;
  xlsx: XlsxOptions; onXlsxChange: (u: Partial<XlsxOptions>) => void;
  xml:  XmlOptions;  onXmlChange:  (u: Partial<XmlOptions>)  => void;
  html: HtmlOptions; onHtmlChange: (u: Partial<HtmlOptions>) => void;
  pdf:  PdfOptions;  onPdfChange:  (u: Partial<PdfOptions>)  => void;
}

const isTextFormat = (f: Format) => (['csv', 'xml', 'html', 'json'] as Format[]).includes(f);

// ── Small layout helpers ──────────────────────────────────────────────────────

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3">
    <div className="text-sm mb-1">{label}</div>
    {children}
  </div>
);

const SwitchRow: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; bold?: boolean }> = ({ label, checked, onChange, bold }) => (
  <div className="switch-row mb-3">
    <InputSwitch checked={checked} onChange={(e) => onChange(e.value ?? false)} />
    <span className={`text-sm${bold ? ' font-medium' : ''}`}>{label}</span>
  </div>
);

const SubOptions: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="sub-options pl-3 mb-3">
    {children}
  </div>
);

// ── Section components ────────────────────────────────────────────────────────

const CsvSettings: React.FC<{ csv: CsvOptions; text: TextOptions; onCsvChange: Props['onCsvChange']; onTextChange: Props['onTextChange'] }> = ({ csv, text, onCsvChange, onTextChange }) => {
  const t = useT();
  return (
    <>
      <Field label={t.tableExportCsvDelimiter}>
        <Dropdown value={csv.delimiter} options={[
          { label: t.tableExportCsvDelimiterSemicolon, value: ';'  },
          { label: t.tableExportCsvDelimiterComma,     value: ','  },
          { label: t.tableExportCsvDelimiterTab,       value: '\t' },
          { label: t.tableExportCsvDelimiterPipe,      value: '|'  },
        ]} onChange={(e) => onCsvChange({ delimiter: e.value })} className="w-full" appendTo="self" />
      </Field>
      <SwitchRow label={t.tableExportCsvBom} checked={csv.bom} onChange={(v) => onCsvChange({ bom: v })} />
      <TextFormatSettings text={text} onTextChange={onTextChange} />
    </>
  );
};

const TextFormatSettings: React.FC<{ text: TextOptions; onTextChange: Props['onTextChange'] }> = ({ text, onTextChange }) => {
  const t = useT();
  return (
    <>
      <Field label={t.tableExportCsvLineEnding}>
        <Dropdown value={text.lineEnding} options={[
          { label: t.tableExportCsvLineEndingCrlf, value: 'crlf' },
          { label: t.tableExportCsvLineEndingLf,   value: 'lf'   },
        ]} onChange={(e) => onTextChange({ lineEnding: e.value as LineEnding })} className="w-full" appendTo="self" />
      </Field>
      <Field label={t.tableExportEncoding}>
        <Dropdown value={text.encoding} options={[
          { label: 'UTF-8',                 value: 'UTF-8'        },
          { label: 'Windows-1250 (CP1250)', value: 'Windows-1250' },
          { label: 'ISO-8859-2 (Latin-2)',  value: 'ISO-8859-2'   },
        ]} onChange={(e) => onTextChange({ encoding: e.value })} className="w-full" appendTo="self" />
      </Field>
      <Field label={t.tableExportDecimalSeparator}>
        <Dropdown value={text.decimal} options={[
          { label: t.tableExportDecimalComma, value: ',' },
          { label: t.tableExportDecimalDot,   value: '.' },
        ]} onChange={(e) => onTextChange({ decimal: e.value })} className="w-full" appendTo="self" />
      </Field>
    </>
  );
};

const XlsxSettings: React.FC<{ xlsx: XlsxOptions; onXlsxChange: Props['onXlsxChange'] }> = ({ xlsx, onXlsxChange }) => {
  const t = useT();
  return (
    <Field label={t.tableExportXlsxSheet}>
      <InputText value={xlsx.sheetName} onChange={(e) => onXlsxChange({ sheetName: e.target.value })} className="w-full" />
    </Field>
  );
};

const XmlSettings: React.FC<{ xml: XmlOptions; onXmlChange: Props['onXmlChange'] }> = ({ xml, onXmlChange }) => {
  const t = useT();
  return (
    <>
      <Field label={t.tableExportXmlRoot}>
        <InputText value={xml.xmlRoot} onChange={(e) => onXmlChange({ xmlRoot: e.target.value })} className="w-full" />
      </Field>
      <Field label={t.tableExportXmlRow}>
        <InputText value={xml.xmlRow} onChange={(e) => onXmlChange({ xmlRow: e.target.value })} className="w-full" />
      </Field>
    </>
  );
};

const HtmlSettings: React.FC<{ html: HtmlOptions; onHtmlChange: Props['onHtmlChange'] }> = ({ html, onHtmlChange }) => {
  const t = useT();
  return (
    <>
      <Field label={t.tableExportHtmlTitle}>
        <InputText value={html.htmlTitle} onChange={(e) => onHtmlChange({ htmlTitle: e.target.value })} className="w-full" />
      </Field>
      <SwitchRow label={t.tableExportHtmlStyles} checked={html.htmlStyles} onChange={(v) => onHtmlChange({ htmlStyles: v })} />
    </>
  );
};

const PdfSettings: React.FC<{ pdf: PdfOptions; onPdfChange: Props['onPdfChange'] }> = ({ pdf, onPdfChange }) => {
  const t = useT();
  return (
    <>
      <Field label={t.tableExportPdfTitle}>
        <InputText value={pdf.title} onChange={(e) => onPdfChange({ title: e.target.value })} className="w-full" />
      </Field>

      {/* Orientation + Paper size side-by-side */}
      <div className="pdf-options-grid mb-3">
        <div>
          <div className="text-sm mb-1">{t.tableExportPdfOrientation}</div>
          <Dropdown value={pdf.orientation} options={[
            { label: t.tableExportPdfOrientationPortrait,  value: 'portrait'  },
            { label: t.tableExportPdfOrientationLandscape, value: 'landscape' },
          ]} onChange={(e) => onPdfChange({ orientation: e.value as PdfOrientation })} className="w-full" appendTo="self" />
        </div>
        <div>
          <div className="text-sm mb-1">{t.tableExportPdfPaperSize}</div>
          <Dropdown value={pdf.paperSize} options={[
            { label: 'A4',     value: 'a4'     },
            { label: 'A3',     value: 'a3'     },
            { label: 'Letter', value: 'letter' },
          ]} onChange={(e) => onPdfChange({ paperSize: e.value as PdfPaperSize })} className="w-full" appendTo="self" />
        </div>
      </div>

      {/* Visual margin editor */}
      <div className="mb-3">
        <PdfMarginEditor
          paperSize={pdf.paperSize}
          orientation={pdf.orientation}
          top={pdf.marginTop}       onTopChange={(v) => onPdfChange({ marginTop: v })}
          bottom={pdf.marginBottom} onBottomChange={(v) => onPdfChange({ marginBottom: v })}
          left={pdf.marginLeft}     onLeftChange={(v) => onPdfChange({ marginLeft: v })}
          right={pdf.marginRight}   onRightChange={(v) => onPdfChange({ marginRight: v })}
        />
      </div>

      {/* Header */}
      <SwitchRow label={t.tableExportPdfHeader} checked={pdf.headerEnabled} onChange={(v) => onPdfChange({ headerEnabled: v })} bold />
      {pdf.headerEnabled && (
        <SubOptions>
          <SwitchRow label={t.tableExportPdfShowTitle}      checked={pdf.headerShowTitle} onChange={(v) => onPdfChange({ headerShowTitle: v })} />
          <SwitchRow label={t.tableExportPdfHeaderShowDate} checked={pdf.headerShowDate} onChange={(v) => onPdfChange({ headerShowDate: v })} />
        </SubOptions>
      )}

      {/* Footer */}
      <SwitchRow label={t.tableExportPdfFooter} checked={pdf.footerEnabled} onChange={(v) => onPdfChange({ footerEnabled: v })} bold />
      {pdf.footerEnabled && (
        <SubOptions>
          <SwitchRow label={t.tableExportPdfFooterShowPageNum} checked={pdf.footerShowPageNum} onChange={(v) => onPdfChange({ footerShowPageNum: v })} />
        </SubOptions>
      )}

      <SwitchRow label={t.tableExportPdfFitToPage} checked={pdf.fitToPage} onChange={(v) => onPdfChange({ fitToPage: v })} />
    </>
  );
};

// ── Main component ────────────────────────────────────────────────────────────

const AdvancedSettings: React.FC<Props> = ({ format, csv, text, xlsx, xml, html, pdf, onCsvChange, onTextChange, onXlsxChange, onXmlChange, onHtmlChange, onPdfChange }) => {
  const t = useT();

  const hasSettings = format !== 'json'; // JSON has no advanced settings

  return (
    <Panel header={t.tableExportAdvanced} toggleable collapsed>
      {!hasSettings && <span className="text-sm text-color-secondary">—</span>}
      {format === 'csv'  && <CsvSettings  csv={csv}  text={text} onCsvChange={onCsvChange}   onTextChange={onTextChange} />}
      {format === 'xlsx' && <XlsxSettings xlsx={xlsx} onXlsxChange={onXlsxChange} />}
      {format === 'xml'  && <XmlSettings  xml={xml}  onXmlChange={onXmlChange} />}
      {format === 'html' && <HtmlSettings html={html} onHtmlChange={onHtmlChange} />}
      {format === 'pdf'  && <PdfSettings  pdf={pdf}  onPdfChange={onPdfChange} />}
      {isTextFormat(format) && format !== 'csv' && (
        <TextFormatSettings text={text} onTextChange={onTextChange} />
      )}
    </Panel>
  );
};

export default AdvancedSettings;
