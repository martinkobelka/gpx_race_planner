import React from 'react';
import { Dialog } from 'primereact/dialog';

interface Props {
  language: string;
  visible: boolean;
  onHide: () => void;
}

const HelpDialog: React.FC<Props> = ({ language, visible, onHide }) => (
  <Dialog
    visible={visible}
    onHide={onHide}
    header={null}
    style={{ width: '860px', maxWidth: '96vw' }}
    contentStyle={{ padding: 0, height: '80vh' }}
    dismissableMask
    modal
  >
    <iframe
      src={`help/${language}.html`}
      title="Help"
      className="help-iframe"
    />
  </Dialog>
);

export default HelpDialog;
