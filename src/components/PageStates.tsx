// Page states (section 13, 8.13) shared by every page: offline, a page part that failed to
// load, and a data check that did not finish. Calm text, no colour that signals alarm.
import { Component, useEffect, useState, type ReactNode } from 'react';
import type { DataMeta } from '../data/types.ts';
import { t, type Lang } from '../i18n/index.ts';
import { formatDate } from '../lib/format.ts';

/** A quiet notice while the browser reports no connection. Pages already open keep working. */
export function OfflineNotice({ lang }: { lang: Lang }) {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  if (!offline) return null;
  return (
    <p className="state-banner" role="status" data-offline="">
      {t(lang, 'state.offline')}
    </p>
  );
}

/** "Last checked" always shows; if that check failed, a note says the figures are from the check before (5.4). */
export function LastChecked({ lang, meta }: { lang: Lang; meta: DataMeta }) {
  return (
    <>
      <p className="muted last-checked">{t(lang, 'home.last_checked', { date: formatDate(meta.last_checked, lang) })}</p>
      {!meta.last_check_ok && (
        <p className="muted" data-refresh-failed="">
          {t(lang, 'state.refresh_failed')}
        </p>
      )}
    </>
  );
}

interface BoundaryProps {
  lang: Lang;
  children: ReactNode;
}

/**
 * When a page part cannot be downloaded (usually a lost connection), say so and offer to try
 * again, instead of a blank page.
 */
export class LoadBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const { lang } = this.props;
    return (
      <div className="wrap">
        <p className="state-note" role="alert" data-load-failed="">
          {t(lang, 'state.load_failed')}{' '}
          <button type="button" className="text-button" onClick={() => location.reload()}>
            {t(lang, 'state.try_again')}
          </button>
        </p>
      </div>
    );
  }
}
