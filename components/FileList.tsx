import React from 'react';
import { UploadedFile } from '../types';
import { IconFile, IconFolder } from './Icon';

interface FileListProps {
  files: UploadedFile[];
  onClear: () => void;
}

const FileList: React.FC<FileListProps> = ({ files, onClear }) => {
  if (files.length === 0) return null;

  // Calculate stats
  const totalSize = files.reduce((acc, curr) => acc + curr.file.size, 0);
  const formattedSize = (totalSize / (1024 * 1024)).toFixed(2) + ' MB';

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex flex-col h-[500px]">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
        <div>
          <h3 className="text-lg font-semibold text-white">Staged Files</h3>
          <p className="text-xs text-slate-400">
            {files.length} items • {formattedSize}
          </p>
        </div>
        <button
          onClick={onClear}
          className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded border border-red-900/50 hover:bg-red-900/20 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {files.map((file) => (
          <div
            key={file.id}
            className="group flex items-center p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-sm border border-transparent hover:border-slate-600"
          >
            <div className="mr-3 text-slate-400 group-hover:text-blue-400">
              {file.path.includes('/') ? <IconFolder className="w-5 h-5" /> : <IconFile className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-slate-200 font-medium">{file.path}</p>
              <p className="text-xs text-slate-500">
                {(file.file.size / 1024).toFixed(1)} KB • {file.file.type || 'Unknown Type'}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FileList;