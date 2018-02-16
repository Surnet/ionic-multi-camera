import { FileEntry } from '@ionic-native/file';

export interface Picture {
  normalizedURL: string;
  fileEntry: FileEntry;
  base64Data: string;
  imageOrientation: number;
}
