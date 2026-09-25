import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import type { SaveOptions, SavedFile, StorageProvider } from './provider.js';

export class LocalStorageProvider implements StorageProvider {
  constructor(
    private readonly rootDir: string,
    private readonly baseUrl: string = '/uploads',
  ) {}

  async save({ fileName, mimeType, buffer }: SaveOptions): Promise<SavedFile> {
    const ext = path.extname(fileName).toLowerCase() || '.' + (mimeType.split('/')[1] ?? 'bin');
    const safeExt = /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : '.img';
    const dateDir = new Date().toISOString().slice(0, 10);
    const dir = path.join(this.rootDir, dateDir);
    await fs.mkdir(dir, { recursive: true });

    const storedName = `${crypto.randomUUID()}${safeExt}`;
    const filePath = path.join(dateDir, storedName);
    await fs.writeFile(path.join(this.rootDir, filePath), buffer);

    return {
      url: `${this.baseUrl}/${filePath.replace(/\\/g, '/')}`,
      filePath: filePath.replace(/\\/g, '/'),
    };
  }
}