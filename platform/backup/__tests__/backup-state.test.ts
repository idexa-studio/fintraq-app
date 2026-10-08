import type * as BackupStateModule from '@/platform/backup/backup-state';

const META = { id: 'f1', name: 'fintraq_backup.json', modifiedTime: '2026-09-30T00:00:00Z', size: 10 };

// Module-level store: load a fresh copy per test.
let store: typeof BackupStateModule;
beforeEach(() => {
  jest.isolateModules(() => {
    store = jest.requireActual<typeof BackupStateModule>('@/platform/backup/backup-state');
  });
});

describe('backup-state', () => {
  it('allows only one operation at a time', () => {
    expect(store.tryBeginOperation('backup', 'preparing')).toBe(true);
    expect(store.tryBeginOperation('restore', 'locating')).toBe(false);
    expect(store.tryBeginOperation('backup', 'preparing')).toBe(false);
    expect(store.isBackupBusy()).toBe(true);

    store.endOperation();
    expect(store.isBackupBusy()).toBe(false);
    expect(store.tryBeginOperation('restore', 'locating')).toBe(true);
  });

  it('records the result only for a successful operation', () => {
    store.tryBeginOperation('backup', 'preparing');
    store.endOperation();
    expect(store.getBackupState().lastCompleted).toBeNull();

    store.tryBeginOperation('backup', 'preparing');
    store.endOperation(META);
    expect(store.getBackupState().lastCompleted).toMatchObject({ operation: 'backup', meta: META });
    expect(store.getBackupState()).toMatchObject({ operation: null, progress: 0, stage: null });
  });

  it('clamps progress and ignores reports while idle', () => {
    store.reportProgress(50, 'ignored');
    expect(store.getBackupState().progress).toBe(0);

    store.tryBeginOperation('restore', 'locating');
    store.reportProgress(140, 'x');
    expect(store.getBackupState().progress).toBe(100);
    store.reportProgress(-3, 'y');
    expect(store.getBackupState().progress).toBe(0);
  });

  it('notifies subscribers on change only, with a stable snapshot between changes', () => {
    const listener = jest.fn();
    const unsubscribe = store.subscribeToBackupState(listener);
    const before = store.getBackupState();
    expect(store.getBackupState()).toBe(before);

    store.tryBeginOperation('backup', 'a');
    store.reportProgress(10, 'b');
    store.reportProgress(10, 'b');
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
    store.endOperation();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
