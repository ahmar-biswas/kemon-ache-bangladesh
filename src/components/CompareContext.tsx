// The country the reader chose in the slicer. Kept in the address (?vs=IND) so it survives
// a language switch and can be shared as a link (section 7: keep chart settings where possible).
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import { useSearchParams } from 'react-router';

interface CompareState {
  /** ISO3 of the highlighted comparison country, or null for "All peers". */
  selected: string | null;
  select: (country: string | null) => void;
}

const Ctx = createContext<CompareState>({ selected: null, select: () => {} });

export function CompareProvider({ peers, children }: { peers: string[]; children: ReactNode }) {
  const [params, setParams] = useSearchParams();
  const vs = params.get('vs');
  const selected = vs && peers.includes(vs) ? vs : null;
  const select = useCallback(
    (country: string | null) => {
      setParams(
        (p) => {
          const next = new URLSearchParams(p);
          if (country) next.set('vs', country);
          else next.delete('vs');
          return next;
        },
        { replace: true, preventScrollReset: true },
      );
    },
    [setParams],
  );
  const value = useMemo(() => ({ selected, select }), [selected, select]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useCompare = () => useContext(Ctx);
