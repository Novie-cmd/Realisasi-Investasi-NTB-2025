
import React, { useState } from 'react';
import { RegencyInvestmentData } from '../types';

interface ImportModalProps {
  onImport: (data: RegencyInvestmentData[]) => void;
  onClose: () => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ onImport, onClose }) => {
  const [fileContent, setFileContent] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleProcess = () => {
    try {
      const parsed = JSON.parse(fileContent);
      if (Array.isArray(parsed)) {
        onImport(parsed as RegencyInvestmentData[]);
        onClose();
      } else {
        setError("Format JSON harus berupa Array data ringkasan wilayah.");
      }
    } catch (e) {
      setError("Gagal memproses file. Pastikan format JSON valid.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg p-8 shadow-2xl animate-in zoom-in duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Sinkronisasi Cloud</h2>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="space-y-6">
          <div className="border-4 border-dashed border-slate-100 rounded-[1.5rem] p-10 text-center hover:border-blue-400 hover:bg-blue-50/30 transition-all cursor-pointer relative group">
            <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <div className="p-4 bg-slate-50 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <svg className="w-8 h-8 text-slate-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            </div>
            <p className="text-sm text-slate-600 font-bold">Klik atau seret file JSON OSS RBA</p>
            <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">Mendukung format export Excel</p>
          </div>

          {error && <div className="bg-rose-50 border border-rose-100 text-rose-600 p-4 rounded-xl text-xs font-bold animate-pulse">{error}</div>}

          <div className="pt-2 flex space-x-3">
            <button 
              onClick={handleProcess} 
              disabled={!fileContent} 
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              SIMPAN KE CLOUD
            </button>
            <button onClick={onClose} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black py-4 rounded-2xl transition-all active:scale-95">BATAL</button>
          </div>
          
          <div className="mt-4 p-4 bg-slate-900 rounded-2xl">
            <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Persyaratan Tabel Supabase:</h4>
            <div className="text-[9px] text-emerald-400 font-mono leading-relaxed opacity-80">
                Nama Tabel: <span className="text-white">investments</span><br/>
                RLS: <span className="text-white">Enable (Allow Authenticated Only)</span><br/>
                Kolom Wajib: <span className="text-white">id, no, kabKota, nilaiInvestasi, etc.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
