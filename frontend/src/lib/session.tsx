import { useCallback, useEffect, useRef } from 'react';
import { getTokenExpiry, renewToken } from '@/lib/utils';

export function SessionKeepAlive() {
  const lastRef = useRef<number>(0);
  const handler = useCallback(async () => {
    const nowMs = Date.now();
    if (nowMs - lastRef.current < 60_000) return; // throttle once per minute
    lastRef.current = nowMs;
    const exp = getTokenExpiry();
    if (!exp) return;
    const now = Math.floor(nowMs / 1000);
    if (exp - now < 600) {
      try { await renewToken(); } catch { /* ignore; next interaction tries again */ }
    }
  }, []);
  useEffect(() => {
    const events = ['click', 'keydown', 'mousemove', 'touchstart'];
    events.forEach(e => window.addEventListener(e, handler));
    return () => { events.forEach(e => window.removeEventListener(e, handler)); };
  }, [handler]);
  return null;
}
