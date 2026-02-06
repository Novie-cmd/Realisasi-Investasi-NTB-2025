
import React from 'react';
import { RegencyInvestmentData } from '../types';

interface InvestmentTableProps {
  data: RegencyInvestmentData[];
}

const InvestmentTable: React.FC<InvestmentTableProps> = ({ data }) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'decimal',
      minimumFractionDigits: 0
    }).format(val);
  };

  const totals = data.reduce((acc, curr) => ({
    esdm: acc.esdm + curr.esdm,
    pariwisata: acc.pariwisata + curr.pariwisata,
    pertanian: acc.pertanian + curr.pertanian,
    pupr: acc.pupr + curr.pupr,
    perdagangan: acc.perdagangan + curr.perdagangan,
    perhubungan: acc.perhubungan + curr.perhubungan,
    telekomunikasi: acc.telekomunikasi + curr.telekomunikasi,
    perindustrian: acc.perindustrian + curr.perindustrian,
    nilaiInvestasi: acc.nilaiInvestasi + curr.nilaiInvestasi,
    tka: acc.tka + curr.tka,
    tki: acc.tki + curr.tki,
    jumlahProyek: acc.jumlahProyek + curr.jumlahProyek,
  }), {
    esdm: 0, pariwisata: 0, pertanian: 0, pupr: 0, perdagangan: 0, 
    perhubungan: 0, telekomunikasi: 0, perindustrian: 0, nilaiInvestasi: 0, tka: 0, tki: 0, jumlahProyek: 0
  });

  return (
    <div className="overflow-x-auto bg-white rounded-[2rem] shadow-sm border border-slate-100 mb-10">
      <table className="min-w-full divide-y divide-slate-200 text-[10px]">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-4 text-left font-black text-slate-500 uppercase tracking-wider">No.</th>
            <th className="px-4 py-4 text-left font-black text-slate-500 uppercase tracking-wider">Kabupaten / Kota</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">ESDM</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">Pariwisata</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">Dagang</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">PUPR</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">Hub</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">Telkom</th>
            <th className="px-2 py-4 text-right font-black text-slate-500 uppercase tracking-wider">Industri</th>
            <th className="px-4 py-4 text-right font-black text-blue-600 uppercase tracking-wider bg-blue-50/50">Total Realisasi</th>
            <th className="px-2 py-4 text-center font-black text-rose-500 uppercase tracking-wider">TKA</th>
            <th className="px-2 py-4 text-center font-black text-indigo-500 uppercase tracking-wider">TKI</th>
            <th className="px-2 py-4 text-center font-black text-slate-700 uppercase tracking-wider">Proyek</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
              <td className="px-3 py-4 text-slate-400 font-bold">{item.no}</td>
              <td className="px-4 py-4 font-black text-slate-800">{item.kabKota}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.esdm)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.pariwisata)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.perdagangan)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.pupr)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.perhubungan)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.telekomunikasi)}</td>
              <td className="px-2 py-4 text-right text-slate-600 font-medium">{formatCurrency(item.perindustrian)}</td>
              <td className="px-4 py-4 text-right font-black text-emerald-600 bg-emerald-50/10">{formatCurrency(item.nilaiInvestasi)}</td>
              <td className="px-2 py-4 text-center text-rose-600 font-black">{item.tka}</td>
              <td className="px-2 py-4 text-center text-indigo-600 font-black">{item.tki}</td>
              <td className="px-2 py-4 text-center font-black text-slate-800">{item.jumlahProyek}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-slate-900 text-white font-black">
          <tr>
            <td colSpan={2} className="px-4 py-5 text-left uppercase tracking-widest text-[11px]">Total Seluruh Provinsi</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.esdm)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.pariwisata)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.perdagangan)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.pupr)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.perhubungan)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.telekomunikasi)}</td>
            <td className="px-2 py-5 text-right opacity-80">{formatCurrency(totals.perindustrian)}</td>
            <td className="px-4 py-5 text-right text-emerald-400 text-xs">{formatCurrency(totals.nilaiInvestasi)}</td>
            <td className="px-2 py-5 text-center text-rose-400">{totals.tka}</td>
            <td className="px-2 py-5 text-center text-indigo-400">{totals.tki}</td>
            <td className="px-2 py-5 text-center">{totals.jumlahProyek}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default InvestmentTable;
