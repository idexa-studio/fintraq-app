/** Shared backup domain types — no runtime imports, safe for any layer. */

export type GoogleUserAccount = {
  id: string;
  email: string;
  name: string | null;
  photo: string | null;
};

export type CloudBackupFileMeta = {
  id: string;
  name: string;
  modifiedTime: string;
  size: number;
};

export type BackupOperation = 'backup' | 'restore';

export type CloudBackupTrigger = 'manual' | 'auto_foreground' | 'auto_background' | 'dev_qa';
