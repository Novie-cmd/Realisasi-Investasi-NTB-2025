
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
    <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-100">
      <table className="min-w-full divide-y divide-gray-200 text-[10px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-3 text-left font-bold text-gray-500 uppercase">No.</th>
            <th className="px-3 py-3 text-left font-bold text-gray-500 uppercase">Kab./Kota</th>
            <th className="px-2 py-3 text-right font-bold text-gray-500 uppercase">ESDM</th>
            <th className="px-2 py-3 text-right font-bold text-gray-500 uppercase">Pariwisata</th>
            <th className="px-2 py-3 text-right font-bold text-gray-500 uppercase">Perdagangan</th>
            <th className="px-2 py-3 text-right font-bold text-gray-500 uppercase">Pertanian</th>
            <th className="px-3 py-3 text-right font-bold text-blue-600 uppercase bg-blue-50/50">Investasi</th>
            <th className="px-2 py-3 text-center font-bold text-gray-500 uppercase">TKA</th>
            <th className="px-2 py-3 text-center font-bold text-gray-500 uppercase">TKI</th>
            <th className="px-2 py-3 text-center font-bold text-gray-500 uppercase">Proyek</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-2 py-3 text-gray-400">{item.no}</td>
              <td className="px-3 py-3 font-semibold text-gray-900">{item.kabKota}</td>
              <td className="px-2 py-3 text-right text-gray-600">{formatCurrency(item.esdm)}</td>
              <td className="px-2 py-3 text-right text-gray-600">{formatCurrency(item.pariwisata)}</td>
              <td className="px-2 py-3 text-right text-gray-600">{formatCurrency(item.perdagangan)}</td>
              <td className="px-2 py-3 text-right text-gray-600">{formatCurrency(item.pertanian)}</td>
              <td className="px-3 py-3 text-right font-bold text-emerald-600 bg-emerald-50/20">{formatCurrency(item.nilaiInvestasi)}</td>
              <td className="px-2 py-3 text-center text-red-600 font-medium">{item.tka}</td>
              <td className="px-2 py-3 text-center text-blue-600 font-medium">{item.tki}</td>
              <td className="px-2 py-3 text-center font-bold text-gray-700">{item.jumlahProyek}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-900 text-white font-bold">
          <tr>
            <td colSpan={2} className="px-3 py-3 text-left uppercase">Total Provinsi</td>
            <td className="px-2 py-3 text-right">{formatCurrency(totals.esdm)}</td>
            <td className="px-2 py-3 text-right">{formatCurrency(totals.pariwisata)}</td>
            <td className="px-2 py-3 text-right">{formatCurrency(totals.perdagangan)}</td>
            <td className="px-2 py-3 text-right">{formatCurrency(totals.pertanian)}</td>
            <td className="px-3 py-3 text-right text-emerald-400">{formatCurrency(totals.nilaiInvestasi)}</td>
            <td className="px-2 py-3 text-center">{totals.tka}</td>
            <td className="px-2 py-3 text-center">{totals.tki}</td>
            <td className="px-2 py-3 text-center">{totals.jumlahProyek}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};

export default InvestmentTable;
