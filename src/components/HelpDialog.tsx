import React, { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { useT } from '../i18n/useT';

interface Props {
  language: string;
  visible: boolean;
  onHide: () => void;
}

const HelpDialog: React.FC<Props> = ({ language, visible, onHide }) => {
  const t = useT();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (visible) setLoaded(false);
  }, [visible]);

  return (
    <Dialog
      visible={visible}
      onHide={onHide}
      header={null}
      className="help-dialog"
      dismissableMask
      modal
    >
      {!loaded && (
        <div className="help-loading">
          <i className="pi pi-spin pi-spinner help-loading__icon" />
          <span>{t.gpxLoading}</span>
        </div>
      )}
      <iframe
        src={`help/${language}.html`}
        title="Help"
        className="help-iframe"
        onLoad={() => setLoaded(true)}
      />
    </Dialog>
  );
};

export default HelpDialog;
