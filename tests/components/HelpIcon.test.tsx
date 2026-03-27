import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import HelpIcon from '../../src/components/HelpIcon';

describe('HelpIcon', () => {
  it('renders the question-circle icon', () => {
    const { container } = render(<HelpIcon id="test-tip" text="Nápověda" />);
    expect(container.querySelector('.pi-question-circle')).toBeInTheDocument();
  });

  it('sets the id attribute on the icon element', () => {
    const { container } = render(<HelpIcon id="my-tooltip" text="Popis" />);
    expect(container.querySelector('#my-tooltip')).toBeInTheDocument();
  });

  it('applies the help-icon CSS class', () => {
    const { container } = render(<HelpIcon id="x" text="text" />);
    expect(container.querySelector('.help-icon')).toBeInTheDocument();
  });
});
