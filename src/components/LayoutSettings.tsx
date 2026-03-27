import React, { useState, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { InputSwitch } from 'primereact/inputswitch';
import { useAppSettings } from '../hooks/useAppSettings';
import { setWideLayout } from '../store/settingsSlice';
import type { AppDispatch } from '../store';
import { useT } from '../i18n/useT';

const LayoutSettings: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { wideLayout } = useAppSettings();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  return (
    <>
      {open && (
        <div
          className="layout-settings-mask"
          onClick={() => setOpen(false)}
        />
      )}

      <div className={`layout-settings-sidebar${open ? ' layout-settings-sidebar--open' : ''}`} ref={panelRef}>
        <div className="layout-settings-sidebar__header">
          <span className="layout-settings-sidebar__title">{t.layoutSettingsLabel}</span>
          <button
            className="layout-settings-sidebar__close"
            onClick={() => setOpen(false)}
            aria-label="Close"
          >
            <i className="pi pi-times" />
          </button>
        </div>

        <div className="layout-settings-sidebar__body">
          <div className="layout-settings-row">
            <div className="layout-settings-row__label">
              <span>{t.layoutWideLabel}</span>
              <span className="layout-settings-row__hint">{t.layoutWideHint}</span>
            </div>
            <InputSwitch
              checked={!!wideLayout}
              onChange={(e) => dispatch(setWideLayout(e.value ?? false))}
            />
          </div>
        </div>
      </div>

      <button
        className="layout-settings-trigger"
        onClick={() => setOpen((v) => !v)}
        title={t.layoutSettingsLabel}
        aria-label={t.layoutSettingsLabel}
      >
        <i className="pi pi-cog" />
      </button>
    </>
  );
};

export default LayoutSettings;
