// RTL matchers
import '@testing-library/jest-dom/vitest';

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

/* Optional: stub console error noise from React act() warnings during tests */
// const origError = console.error;
// console.error = (...args) => {
//   const msg = String(args[0] ?? '');
//   if (msg.includes('Warning: An update to') && msg.includes('not wrapped in act')) return;
//   origError(...args);
// };
