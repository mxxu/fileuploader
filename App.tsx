import React, { useState, useCallback } from 'react';
import { UploadedFile, ProcessingLog } from './types';
import DropZone from './components/DropZone';
import FileList from './components/FileList';
import { saveFilesToDirectory, isFileSystemAccessSupported, saveFilesAsZip } from './services/fileSystem';
import { IconSave } from './components/Icon';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [logs, setLogs] = useState<ProcessingLog[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);

  const addLog = (message: string, type: ProcessingLog['type'] = 'info') => {
    setLogs(prev => [{ timestamp: new Date(), message, type }, ...prev]);
  };

  const handleFilesSelected = useCallback((selectedFiles: FileList | File[]) => {
    const newFiles: UploadedFile[] = Array.from(selectedFiles).map(file => {
      // Normalize path. If webkitRelativePath exists (folder upload), use it. 
      // Otherwise use name (single file upload).
      const path = file.webkitRelativePath || file.name;
      return {
        id: Math.random().toString(36).substr(2, 9),
        file,
        path,
        type: 'file'
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
    addLog(`Added ${newFiles.length} files to staging area.`, 'info');
  }, []);

  const handleClear = () => {
    setFiles([]);
    setLogs([]);
    setSaveProgress(null);
  };

  const handleSaveToLocal = async () => {
    setIsSaving(true);
    setSaveProgress({ current: 0, total: files.length });
    addLog("Starting save operation...", "info");

    try {
      // Try Native File System Access API first
      if (isFileSystemAccessSupported()) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          addLog(`Selected directory: ${dirHandle.name}`, "info");

          await saveFilesToDirectory(
            dirHandle,
            files,
            (current, total, filename) => {
              setSaveProgress({ current, total });
            }
          );

          addLog("All files saved successfully!", "success");
          alert("Files saved successfully!");
          return; // Exit if successful
        } catch (err: any) {
          // Check for AbortError (user cancelled picker)
          if (err.name === 'AbortError') {
            throw err;
          }
          // Log specific error and fall through to ZIP
          console.warn("File System Access API failed (likely iframe/security restriction). Falling back to ZIP.", err);
          addLog("Direct folder access blocked by browser security. Falling back to ZIP download...", "warning");
        }
      } else {
        addLog("File System Access API not supported. Using ZIP download.", "info");
      }

      // Fallback: Download as ZIP
      await saveFilesAsZip(files);
      addLog("Files downloaded as ZIP archive.", "success");

    } catch (error: any) {
      if (error.name === 'AbortError') {
        addLog("Save operation cancelled by user.", "warning");
      } else {
        console.error(error);
        addLog(`Error saving files: ${error.message}`, "error");
        alert(`Error: ${error.message}`);
      }
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
      
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              LocalDrive Sync
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Top Section: Upload and Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
             <div className="bg-slate-900 rounded-2xl p-1 shadow-xl border border-slate-800">
               <DropZone onFilesSelected={handleFilesSelected} disabled={isSaving} />
             </div>

             {/* Action Bar */}
             <div className="flex flex-wrap gap-4 items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-4">
                   {saveProgress && (
                     <div className="flex flex-col">
                       <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider mb-1">
                         {isFileSystemAccessSupported() ? 'Processing...' : 'Archiving...'}
                       </span>
                       <div className="w-48 h-2 bg-slate-700 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-blue-500 transition-all duration-300 ease-out"
                           style={{ width: `${(saveProgress.current / saveProgress.total) * 100}%` }}
                         />
                       </div>
                       <span className="text-xs text-slate-400 mt-1">{saveProgress.current} / {saveProgress.total} files</span>
                     </div>
                   )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleSaveToLocal}
                    disabled={files.length === 0 || isSaving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20 active:scale-95"
                  >
                    {isSaving ? (
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                    ) : (
                      <IconSave className="w-5 h-5" />
                    )}
                    Save to Disk
                  </button>
                </div>
             </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
             {/* File List */}
             <FileList files={files} onClear={handleClear} />

             {/* Activity Logs */}
             <div className="bg-slate-900 rounded-xl border border-slate-800 p-4 h-[300px] overflow-hidden flex flex-col">
               <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Activity Log</h3>
               <div className="flex-1 overflow-y-auto space-y-2 font-mono text-xs">
                 {logs.length === 0 && <span className="text-slate-600 italic">No activity yet.</span>}
                 {logs.map((log, i) => (
                   <div key={i} className={`flex gap-2 ${
                     log.type === 'error' ? 'text-red-400' : 
                     log.type === 'success' ? 'text-emerald-400' : 
                     log.type === 'warning' ? 'text-yellow-400' : 'text-slate-400'
                   }`}>
                     <span className="opacity-50">[{log.timestamp.toLocaleTimeString()}]</span>
                     <span>{log.message}</span>
                   </div>
                 ))}
               </div>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;