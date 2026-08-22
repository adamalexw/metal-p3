import { useState } from 'react';
import { errorMessage } from './error-message';

interface ConfirmDeleteOptions<T> {
  /** Return an error message to keep the sheet open, or null on success. */
  performDelete: (item: T) => Promise<string | null>;
  onCancel?: (item: T) => void;
}

export interface ConfirmDeleteFlow<T> {
  pending: T | null;
  busy: boolean;
  error: string | null;
  request: (item: T) => void;
  confirm: () => void;
  cancel: () => void;
  /** Spreads into ConfirmDeleteSheet; title/message/confirmLabel stay per-screen. */
  sheetProps: {
    visible: boolean;
    busy: boolean;
    error: string | null;
    onConfirm: () => void;
    onCancel: () => void;
  };
}

export function useConfirmDelete<T>({
  performDelete,
  onCancel,
}: ConfirmDeleteOptions<T>): ConfirmDeleteFlow<T> {
  const [pending, setPending] = useState<T | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const request = (item: T) => {
    setError(null);
    setPending(item);
  };

  const confirm = () => {
    if (pending === null || busy) return;
    setBusy(true);
    setError(null);
    void (async () => {
      try {
        const failure = await performDelete(pending);
        if (failure !== null) {
          setError(failure);
          setBusy(false);
          return;
        }
        setPending(null);
        setBusy(false);
      } catch (err) {
        setError(errorMessage(err));
        setBusy(false);
      }
    })();
  };

  const cancel = () => {
    if (busy) return;
    const item = pending;
    setPending(null);
    setError(null);
    if (item !== null) onCancel?.(item);
  };

  return {
    pending,
    busy,
    error,
    request,
    confirm,
    cancel,
    sheetProps: {
      visible: pending !== null,
      busy,
      error,
      onConfirm: confirm,
      onCancel: cancel,
    },
  };
}
