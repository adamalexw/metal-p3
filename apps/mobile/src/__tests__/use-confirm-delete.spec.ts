import { act, renderHook } from '@testing-library/react-native';
import { useConfirmDelete } from '../lib/useConfirmDelete';

describe('useConfirmDelete', () => {
  describe('request', () => {
    it('should expose the item as pending and clear a previous error', async () => {
      const { result } = renderHook(() =>
        useConfirmDelete<string>({ performDelete: jest.fn().mockResolvedValue('nope') }),
      );

      act(() => result.current.request('a'));
      await act(async () => result.current.confirm());
      expect(result.current.error).toBe('nope');

      act(() => result.current.request('b'));
      expect(result.current.pending).toBe('b');
      expect(result.current.error).toBeNull();
      expect(result.current.sheetProps.visible).toBe(true);
    });
  });

  describe('confirm', () => {
    it('should close the sheet when performDelete succeeds', async () => {
      const performDelete = jest.fn().mockResolvedValue(null);
      const { result } = renderHook(() => useConfirmDelete<string>({ performDelete }));

      act(() => result.current.request('a'));
      await act(async () => result.current.confirm());

      expect(performDelete).toHaveBeenCalledWith('a');
      expect(result.current.pending).toBeNull();
      expect(result.current.busy).toBe(false);
      expect(result.current.sheetProps.visible).toBe(false);
    });

    it('should keep the sheet open and show the message when performDelete reports failure', async () => {
      const { result } = renderHook(() =>
        useConfirmDelete<string>({
          performDelete: jest.fn().mockResolvedValue('Delete was cancelled or failed.'),
        }),
      );

      act(() => result.current.request('a'));
      await act(async () => result.current.confirm());

      expect(result.current.pending).toBe('a');
      expect(result.current.error).toBe('Delete was cancelled or failed.');
      expect(result.current.busy).toBe(false);
    });

    it('should surface a thrown error message', async () => {
      const { result } = renderHook(() =>
        useConfirmDelete<string>({
          performDelete: jest.fn().mockRejectedValue(new Error('boom')),
        }),
      );

      act(() => result.current.request('a'));
      await act(async () => result.current.confirm());

      expect(result.current.pending).toBe('a');
      expect(result.current.error).toBe('boom');
    });

    it('should ignore confirm while busy or with nothing pending', async () => {
      let release: (value: string | null) => void = () => undefined;
      const performDelete = jest.fn(
        () => new Promise<string | null>((resolve) => { release = resolve; }),
      );
      const { result } = renderHook(() => useConfirmDelete<string>({ performDelete }));

      act(() => result.current.confirm());
      expect(performDelete).not.toHaveBeenCalled();

      act(() => result.current.request('a'));
      act(() => result.current.confirm());
      act(() => result.current.confirm());
      expect(performDelete).toHaveBeenCalledTimes(1);

      await act(async () => release(null));
    });
  });

  describe('cancel', () => {
    it('should clear pending state and notify onCancel with the item', () => {
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useConfirmDelete<string>({ performDelete: jest.fn(), onCancel }),
      );

      act(() => result.current.request('a'));
      act(() => result.current.cancel());

      expect(result.current.pending).toBeNull();
      expect(onCancel).toHaveBeenCalledWith('a');
    });

    it('should be a no-op while busy', () => {
      const onCancel = jest.fn();
      const { result } = renderHook(() =>
        useConfirmDelete<string>({
          performDelete: jest.fn(() => new Promise<string | null>(() => undefined)),
          onCancel,
        }),
      );

      act(() => result.current.request('a'));
      act(() => result.current.confirm());
      act(() => result.current.cancel());

      expect(result.current.pending).toBe('a');
      expect(onCancel).not.toHaveBeenCalled();
    });
  });
});
