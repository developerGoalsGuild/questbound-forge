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
  AlertTriangle: () => React.createElement('div', { 'data-testid': 'alert-triangle-icon' }),
  Loader2: () => React.createElement('div', { 'data-testid': 'loader2-icon' }),
  Info: () => React.createElement('div', { 'data-testid': 'info-icon' }),
  X: () => React.createElement('div', { 'data-testid': 'x-icon' }),
  Pencil: () => React.createElement('div', { 'data-testid': 'pencil-icon' }),
  Trash: () => React.createElement('div', { 'data-testid': 'trash-icon' }),
  Trash2: () => React.createElement('div', { 'data-testid': 'trash2-icon' }),
  XCircle: () => React.createElement('div', { 'data-testid': 'x-circle-icon' }),
  Check: () => React.createElement('div', { 'data-testid': 'check-icon' }),
  Eye: () => React.createElement('div', { 'data-testid': 'icon-eye' }),
  EyeOff: () => React.createElement('div', { 'data-testid': 'icon-eye-off' }),
  Search: () => React.createElement('div', { 'data-testid': 'search-icon' }),
  Filter: () => React.createElement('div', { 'data-testid': 'filter-icon' }),
  ChevronLeft: () => React.createElement('div', { 'data-testid': 'chevron-left-icon' }),
  ChevronRight: () => React.createElement('div', { 'data-testid': 'chevron-right-icon' }),
  ChevronDown: () => React.createElement('div', { 'data-testid': 'chevron-down-icon' }),
  ChevronUp: () => React.createElement('div', { 'data-testid': 'chevron-up-icon' }),
  Calendar: () => React.createElement('div', { 'data-testid': 'calendar-icon' }),
  Target: () => React.createElement('div', { 'data-testid': 'target-icon' }),
  MoreHorizontal: () => React.createElement('div', { 'data-testid': 'more-horizontal-icon' }),
  Star: () => React.createElement('div', { 'data-testid': 'star-icon' }),
  User: () => React.createElement('div', { 'data-testid': 'user-icon' }),
  Settings: () => React.createElement('div', { 'data-testid': 'settings-icon' }),
  Home: () => React.createElement('div', { 'data-testid': 'home-icon' }),
  Trophy: () => React.createElement('div', { 'data-testid': 'trophy-icon' }),
  Heart: () => React.createElement('div', { 'data-testid': 'heart-icon' }),
  BookOpen: () => React.createElement('div', { 'data-testid': 'book-open-icon' }),
  Clock: () => React.createElement('div', { 'data-testid': 'clock-icon' }),
  RefreshCw: () => React.createElement('div', { 'data-testid': 'refresh-cw-icon' }),
  LogOut: () => React.createElement('div', { 'data-testid': 'log-out-icon' }),
  Play: () => React.createElement('div', { 'data-testid': 'play-icon' }),
  Pause: () => React.createElement('div', { 'data-testid': 'pause-icon' }),
  Stop: () => React.createElement('div', { 'data-testid': 'stop-icon' }),
  Shield: () => React.createElement('div', { 'data-testid': 'shield-icon' }),
  Edit: () => React.createElement('div', { 'data-testid': 'edit-icon' }),
  Save: () => React.createElement('div', { 'data-testid': 'save-icon' }),
  Upload: () => React.createElement('div', { 'data-testid': 'upload-icon' }),
  Download: () => React.createElement('div', { 'data-testid': 'download-icon' }),
  Copy: () => React.createElement('div', { 'data-testid': 'copy-icon' }),
  ExternalLink: () => React.createElement('div', { 'data-testid': 'external-link-icon' }),
  Link: () => React.createElement('div', { 'data-testid': 'link-icon' }),
  Mail: () => React.createElement('div', { 'data-testid': 'mail-icon' }),
  Phone: () => React.createElement('div', { 'data-testid': 'phone-icon' }),
  Globe: () => React.createElement('div', { 'data-testid': 'globe-icon' }),
  Lock: () => React.createElement('div', { 'data-testid': 'lock-icon' }),
  Unlock: () => React.createElement('div', { 'data-testid': 'unlock-icon' }),
  Key: () => React.createElement('div', { 'data-testid': 'key-icon' }),
  Database: () => React.createElement('div', { 'data-testid': 'database-icon' }),
  Server: () => React.createElement('div', { 'data-testid': 'server-icon' }),
  Cloud: () => React.createElement('div', { 'data-testid': 'cloud-icon' }),
  Wifi: () => React.createElement('div', { 'data-testid': 'wifi-icon' }),
  Image: () => React.createElement('div', { 'data-testid': 'image-icon' }),
  Video: () => React.createElement('div', { 'data-testid': 'video-icon' }),
  Music: () => React.createElement('div', { 'data-testid': 'music-icon' }),
  Volume: () => React.createElement('div', { 'data-testid': 'volume-icon' }),
  VolumeX: () => React.createElement('div', { 'data-testid': 'volume-x-icon' }),
  Maximize: () => React.createElement('div', { 'data-testid': 'maximize-icon' }),
  Minimize: () => React.createElement('div', { 'data-testid': 'minimize-icon' }),
  SkipBack: () => React.createElement('div', { 'data-testid': 'skip-back-icon' }),
  SkipForward: () => React.createElement('div', { 'data-testid': 'skip-forward-icon' }),
  Repeat: () => React.createElement('div', { 'data-testid': 'repeat-icon' }),
  Shuffle: () => React.createElement('div', { 'data-testid': 'shuffle-icon' }),
  Briefcase: () => React.createElement('div', { 'data-testid': 'briefcase-icon' }),
  DollarSign: () => React.createElement('div', { 'data-testid': 'dollar-sign-icon' }),
  Palette: () => React.createElement('div', { 'data-testid': 'palette-icon' }),
  Users: () => React.createElement('div', { 'data-testid': 'users-icon' }),
  Bell: () => React.createElement('div', { 'data-testid': 'bell-icon' }),
  MessageCircle: () => React.createElement('div', { 'data-testid': 'message-circle-icon' }),
  Send: () => React.createElement('div', { 'data-testid': 'send-icon' }),
  Archive: () => React.createElement('div', { 'data-testid': 'archive-icon' }),
  Folder: () => React.createElement('div', { 'data-testid': 'folder-icon' }),
  File: () => React.createElement('div', { 'data-testid': 'file-icon' }),
  FileText: () => React.createElement('div', { 'data-testid': 'file-text-icon' }),
  Bookmark: () => React.createElement('div', { 'data-testid': 'bookmark-icon' }),
  Flag: () => React.createElement('div', { 'data-testid': 'flag-icon' }),
  Tag: () => React.createElement('div', { 'data-testid': 'tag-icon' }),
  Hash: () => React.createElement('div', { 'data-testid': 'hash-icon' }),
  Zap: () => React.createElement('div', { 'data-testid': 'zap-icon' }),
  Activity: () => React.createElement('div', { 'data-testid': 'activity-icon' }),
  TrendingUp: () => React.createElement('div', { 'data-testid': 'trending-up-icon' }),
  TrendingDown: () => React.createElement('div', { 'data-testid': 'trending-down-icon' }),
  BarChart: () => React.createElement('div', { 'data-testid': 'bar-chart-icon' }),
  PieChart: () => React.createElement('div', { 'data-testid': 'pie-chart-icon' }),
  Award: () => React.createElement('div', { 'data-testid': 'award-icon' }),
  Gift: () => React.createElement('div', { 'data-testid': 'gift-icon' }),
  Package: () => React.createElement('div', { 'data-testid': 'package-icon' }),
  ShoppingCart: () => React.createElement('div', { 'data-testid': 'shopping-cart-icon' }),
  CreditCard: () => React.createElement('div', { 'data-testid': 'credit-card-icon' }),
  Timer: () => React.createElement('div', { 'data-testid': 'timer-icon' }),
  Compass: () => React.createElement('div', { 'data-testid': 'compass-icon' }),
  MapPin: () => React.createElement('div', { 'data-testid': 'map-pin-icon' }),
       }));

/* Optional: stub console error noise from React act() warnings during tests */
// const origError = console.error;
// logger.error = (...args) => {
//   const msg = String(args[0] ?? '');
//   if (msg.includes('Warning: An update to') && msg.includes('not wrapped in act')) return;
//   origError(...args);
// };
