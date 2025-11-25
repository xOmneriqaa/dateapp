// React 19 shim for useSyncExternalStoreWithSelector
// This provides the selector functionality on top of React 19's built-in useSyncExternalStore
import { useSyncExternalStore, useRef, useCallback, useMemo } from 'react';

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: undefined | null | (() => Snapshot),
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean
): Selection {
  const instRef = useRef<{ hasValue: boolean; value: Selection } | null>(null);

  const getSelection = useCallback(() => {
    const nextSnapshot = getSnapshot();
    const nextSelection = selector(nextSnapshot);

    if (instRef.current !== null && instRef.current.hasValue) {
      const prevSelection = instRef.current.value;
      if (isEqual !== undefined ? isEqual(prevSelection, nextSelection) : prevSelection === nextSelection) {
        return prevSelection;
      }
    }

    instRef.current = { hasValue: true, value: nextSelection };
    return nextSelection;
  }, [getSnapshot, selector, isEqual]);

  const getServerSelection = useMemo(() => {
    if (getServerSnapshot === undefined || getServerSnapshot === null) {
      return undefined;
    }
    return () => selector(getServerSnapshot());
  }, [getServerSnapshot, selector]);

  return useSyncExternalStore(
    subscribe,
    getSelection,
    getServerSelection
  );
}
