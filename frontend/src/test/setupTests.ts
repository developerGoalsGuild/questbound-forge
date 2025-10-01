// RTL matchers
import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

// ---- Lightweight browser shims useful for many React apps ----
/* matchMedia */
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},            // deprecated
    removeListener: () => {},         // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

/* ResizeObserver */
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: ResizeObserverMock,
});

/* IntersectionObserver */
class IntersectionObserverMock {
  constructor(_: any) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
}
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: IntersectionObserverMock,
});

/* scrollTo */
window.scrollTo = window.scrollTo || (() => {});

/* URL.createObjectURL (used by some image/file UIs) */
if (!('createObjectURL' in URL)) {
  // @ts-expect-error
  URL.createObjectURL = () => 'blob:mock';
}

/* crypto.getRandomValues (some libs expect it) */
import { webcrypto } from 'node:crypto';
// @ts-expect-error types for jsdom Window vs Node global
if (!globalThis.crypto?.getRandomValues) {
  // @ts-expect-error
  globalThis.crypto = webcrypto as unknown as Crypto;
}

/* TextEncoder/TextDecoder for Node < 20 environments */
import { TextEncoder, TextDecoder } from 'node:util';
// @ts-expect-error
if (!globalThis.TextEncoder) globalThis.TextEncoder = TextEncoder as any;
// @ts-expect-error
if (!globalThis.TextDecoder) globalThis.TextDecoder = TextDecoder as any;

/* Mock lucide-react icons */
vi.mock('lucide-react', () => ({
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }),
  Plus: () => React.createElement('div', { 'data-testid': 'plus-icon' }),
  Sparkles: () => React.createElement('div', { 'data-testid': 'sparkles-icon' }),
  Lightbulb: () => React.createElement('div', { 'data-testid': 'lightbulb-icon' }),
  CheckCircle: () => React.createElement('div', { 'data-testid': 'check-circle-icon' }),
  AlertCircle: () => React.createElement('div', { 'data-testid': 'alert-circle-icon' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader2-icon' }),
  Info: () => React.createElement('div', { 'data-testid': 'info-icon' }),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  Pencil: () => React.createElement('div', { 'data-testid': 'pencil-icon' }),
  Trash: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
  XCircle: () => React.createElement('div', { 'data-testid': 'x-circle-icon' }),
  Check: () => React.createElement('div', { 'data-testid': 'check-icon' }),
  Eye: () => React.createElement('div', { 'data-testid': 'icon-eye' }),
  EyeOff: () => React.createElement('div', { 'data-testid': 'icon-eye-off' }),
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
  Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }),
  ChevronLeft: () => React.createElement('div', { 'data-testid': 'chevron-left-icon' }),
  ChevronRight: () => React.createElement('div', { 'data-testid': 'chevron-right-icon' }),
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  Target: () => React.createElement('div', { 'data-testid': 'target-icon' }),
  MoreHorizontal: () => React.createElement('div', { 'data-testid': 'more-horizontal-icon' }),
  ArrowLeft: () => React.createElement('div', { 'data-testid': 'arrow-left-icon' }),
}));

/* Optional: stub console error noise from React act() warnings during tests */
// const origError = console.error;
// console.error = (...args) => {
//   const msg = String(args[0] ?? '');
//   if (msg.includes('Warning: An update to') && msg.includes('not wrapped in act')) return;
//   origError(...args);
// };
