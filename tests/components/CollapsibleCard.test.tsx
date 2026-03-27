import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import React from 'react';
import CollapsibleCard from '../../src/components/CollapsibleCard';
import settingsReducer from '../../src/store/settingsSlice';

function renderCard(props: Partial<Parameters<typeof CollapsibleCard>[0]> = {}) {
  const store = configureStore({ reducer: { settings: settingsReducer } });
  return render(
    <Provider store={store}>
      <CollapsibleCard title="Testovací karta" {...props}>
        <span>Obsah karty</span>
      </CollapsibleCard>
    </Provider>
  );
}

// --- rendering ---

describe('CollapsibleCard – rendering', () => {
  it('renders the title', () => {
    renderCard();
    expect(screen.getByText('Testovací karta')).toBeInTheDocument();
  });

  it('renders children by default', () => {
    renderCard();
    expect(screen.getByText('Obsah karty')).toBeInTheDocument();
  });

  it('renders with defaultCollapsed=true — body has collapsed class', () => {
    const { container } = renderCard({ defaultCollapsed: true });
    expect(container.querySelector('.collapsible-card-body--collapsed')).toBeInTheDocument();
  });

  it('does not have collapsed class by default', () => {
    const { container } = renderCard();
    expect(container.querySelector('.collapsible-card-body--collapsed')).not.toBeInTheDocument();
  });
});

// --- collapse / expand toggle ---

describe('CollapsibleCard – collapse toggle', () => {
  it('collapses when the chevron button is clicked', async () => {
    const { container } = renderCard();
    const btn = container.querySelector('.collapsible-card-btn') as HTMLElement;
    await userEvent.click(btn);
    expect(container.querySelector('.collapsible-card-body--collapsed')).toBeInTheDocument();
  });

  it('expands again on second click', async () => {
    const { container } = renderCard();
    const btn = container.querySelector('.collapsible-card-btn') as HTMLElement;
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(container.querySelector('.collapsible-card-body--collapsed')).not.toBeInTheDocument();
  });

  it('starts expanded and collapses when defaultCollapsed=false', async () => {
    const { container } = renderCard({ defaultCollapsed: false });
    expect(container.querySelector('.collapsible-card-body--collapsed')).not.toBeInTheDocument();
    const btn = container.querySelector('.collapsible-card-btn') as HTMLElement;
    await userEvent.click(btn);
    expect(container.querySelector('.collapsible-card-body--collapsed')).toBeInTheDocument();
  });
});

// --- headerExtra ---

describe('CollapsibleCard – headerExtra', () => {
  it('renders headerExtra content', () => {
    renderCard({ headerExtra: () => <button>Export</button> });
    expect(screen.getByText('Export')).toBeInTheDocument();
  });

  it('passes collapsed=false to headerExtra when expanded', () => {
    const captured: boolean[] = [];
    renderCard({ headerExtra: (c) => { captured.push(c); return null; } });
    expect(captured[captured.length - 1]).toBe(false);
  });

  it('passes collapsed=true to headerExtra after collapsing', async () => {
    const captured: boolean[] = [];
    const { container } = renderCard({ headerExtra: (c) => { captured.push(c); return null; } });
    const btn = container.querySelector('.collapsible-card-btn') as HTMLElement;
    await userEvent.click(btn);
    expect(captured[captured.length - 1]).toBe(true);
  });
});
