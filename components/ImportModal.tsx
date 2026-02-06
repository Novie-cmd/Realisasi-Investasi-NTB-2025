
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Import Data Excel (JSON)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer relative">
            <input type="file" accept=".json" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
            <p className="text-sm text-gray-600 font-medium">Klik untuk pilih file JSON hasil export Excel</p>
          </div>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs">{error}</div>}

          <div className="pt-4 flex space-x-3">
            <button onClick={handleProcess} disabled={!fileContent} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold py-2 rounded-lg transition-colors">Import Data</button>
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-colors">Batal</button>
          </div>
          
          <div className="mt-4">
            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Struktur JSON yang Diharapkan:</h4>
            <pre className="text-[10px] bg-gray-900 text-emerald-400 p-3 rounded-lg overflow-x-auto leading-relaxed">
{`[{
  "no": 4,
  "kabKota": "Lombok Timur",
  "pertambangan": 0,
  "perdagangan": 15000000,
  "pariwisata": 85000000,
  "pertanian": 20000000,
  "infrastruktur": 10000000,
  "nilaiInvestasi": 130000000,
  "tka": 5,
  "tki": 150,
  "jumlahProyek": 20
}]`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
