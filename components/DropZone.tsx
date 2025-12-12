import React, { useRef, useState, ChangeEvent } from 'react';
import { IconUpload, IconFolder, IconFile } from './Icon';

interface DropZoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  disabled: boolean;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative border-2 border-dashed rounded-xl p-10 text-center transition-all duration-300
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-slate-800 rounded-full shadow-lg">
          <IconUpload className={`w-10 h-10 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
        </div>
        
        <div className="space-y-1">
          <p className="text-xl font-semibold text-white">
            Drag & Drop files or folders here
          </p>
          <p className="text-sm text-slate-400">
            or click the buttons below to browse
          </p>
        </div>

        <div className="flex gap-3 mt-4 pointer-events-auto">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors disabled:bg-slate-700"
          >
            <IconFile className="w-4 h-4" />
            Select Files
          </button>

          <button
            onClick={() => folderInputRef.current?.click()}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors disabled:bg-slate-700"
          >
            <IconFolder className="w-4 h-4" />
            Select Folder
          </button>
        </div>

        {/* Hidden Inputs */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          className="hidden"
        />
        <input
          type="file"
          ref={folderInputRef}
          onChange={handleFileChange}
          className="hidden"
          // @ts-ignore - webkitdirectory is standard in modern browsers but missing in some React TS defs
          webkitdirectory=""
          directory=""
        />
      </div>
    </div>
  );
};

export default DropZone;