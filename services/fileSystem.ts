import { FileSystemDirectoryHandle, UploadedFile } from '../types';
import JSZip from 'jszip';

/**
 * Saves a list of files to a directory handle, recreating the folder structure.
 */
export const saveFilesToDirectory = async (
  rootHandle: FileSystemDirectoryHandle,
  files: UploadedFile[],
  onProgress: (current: number, total: number, filename: string) => void
): Promise<void> => {
  let processed = 0;

  for (const fileObj of files) {
    const parts = fileObj.path.split('/').filter(p => p !== '.' && p !== '');
    const fileName = parts.pop(); // Last part is the file name
    
    if (!fileName) continue;

    let currentDirHandle = rootHandle;

    // Traverse/Create directories
    for (const folderName of parts) {
      currentDirHandle = await currentDirHandle.getDirectoryHandle(folderName, { create: true });
    }

    // Create File
    const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });
    
    // Write content
    const writable = await fileHandle.createWritable();
    await writable.write(fileObj.file);
    await writable.close();

    processed++;
    onProgress(processed, files.length, fileObj.path);
  }
};

/**
 * Saves files as a ZIP archive (Fallback for environments without File System Access)
 */
export const saveFilesAsZip = async (
  files: UploadedFile[]
): Promise<void> => {
  const zip = new JSZip();

  files.forEach((fileObj) => {
    zip.file(fileObj.path, fileObj.file);
  });

  const blob = await zip.generateAsync({ type: "blob" });
  
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = "localdrive-export.zip";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Utility to verify browser support
 */
export const isFileSystemAccessSupported = (): boolean => {
  return 'showDirectoryPicker' in window;
};