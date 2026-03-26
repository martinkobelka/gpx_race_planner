import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Menubar } from 'primereact/menubar';
import type { MenuItem } from 'primereact/menuitem';
import { useSegmentData } from '../hooks/useSegmentData';
import { useAppSettings } from '../hooks/useAppSettings';
import { useFullReset } from '../hooks/useFullReset';
import type { AppDispatch } from '../store';
import { setLanguage } from '../store/settingsSlice';
import { useT } from '../i18n/useT';
import { LANGS } from '../constants';
import GarminWorkoutExport from './GarminWorkoutExport';
import HelpDialog from './HelpDialog';

const AppMenubar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const t = useT();
  const { segments } = useSegmentData();
  const { language } = useAppSettings();
  const handleFullReset = useFullReset();
  const [helpVisible, setHelpVisible] = useState(false);

  const menuItems: MenuItem[] = [
    { label: t.resetAll, icon: 'pi pi-refresh', command: handleFullReset },
    { separator: true },
    {
      label: t.downloadFit,
      icon: 'pi pi-download',
      disabled: segments.length === 0,
      command: () => document.getElementById('garmin-export-btn')?.click(),
    },
    { separator: true },
    {
      label: t.help,
      icon: 'pi pi-question-circle',
      command: () => setHelpVisible(true),
    },
  ];

  const start = (
    <div className="menubar-brand">
      <img src={`${import.meta.env.BASE_URL}logo.png`} alt="logo" className="menubar-brand__icon" />
      <span className="menubar-brand__name">{t.appName}</span>
    </div>
  );

  const end = (
    <div className="flex align-items-center gap-2">
      <div className="lang-switcher">
        {LANGS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => dispatch(setLanguage(value))}
            className={`lang-btn${language === value ? ' lang-btn--active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="fit-export-hidden">
        <GarminWorkoutExport id="garmin-export-btn" />
      </div>
    </div>
  );

  return (
    <>
      <Menubar model={menuItems} start={start} end={end} className="app-menubar" />
      <HelpDialog language={language} visible={helpVisible} onHide={() => setHelpVisible(false)} />
    </>
  );
};

export default AppMenubar;
