export interface SaveOptions {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

export interface SavedFile {
  url: string;
  filePath: string;
}

export interface StorageProvider {
  save(options: SaveOptions): Promise<SavedFile>;
}