
import React, { useMemo } from 'react';
import { RegencyInvestmentData } from '../types';
import { QUARTERS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from 'recharts';

interface QuarterlyViewProps {
  data: RegencyInvestmentData[];
}

const QuarterlyView: React.FC<QuarterlyViewProps> = ({ data }) => {
  const formatIDR = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatIDR_Short = (val: number) => {
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  };

  const quarterTotals = useMemo(() => {
    return QUARTERS.map(q => ({
      label: q.label,
      value: data.reduce((sum, item) => sum + (item as any)[q.key], 0)
    }));
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.kabKota,
      tw1: item.tw1 / 1000000000,
      tw2: item.tw2 / 1000000000,
      tw3: item.tw3 / 1000000000,
      tw4: item.tw4 / 1000000000,
    }));
  }, [data]);

  const tableTotals = data.reduce((acc, curr) => ({
    tw1: acc.tw1 + curr.tw1,
    tw2: acc.tw2 + curr.tw2,
    tw3: acc.tw3 + curr.tw3,
    tw4: acc.tw4 + curr.tw4,
    total: acc.total + curr.nilaiInvestasi
  }), { tw1: 0, tw2: 0, tw3: 0, tw4: 0, total: 0 });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Quarterly Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quarterTotals.map((q, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">{q.label}</p>
            <h4 className="text-xl font-black text-slate-800 relative z-10">{formatIDR_Short(q.value)}</h4>
            <div className={`mt-3 h-1 w-12 rounded-full ${idx === 2 ? 'bg-indigo-500' : 'bg-blue-500'}`}></div>
          </div>
        ))}
      </div>

      {/* Comparative Chart */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-8 text-lg uppercase tracking-tight">Perbandingan Pertumbuhan antar Wilayah (Miliar Rp)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={10} fontStyle="bold" tickLine={false} axisLine={false} />
              <YAxis fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                cursor={{fill: '#f8fafc'}} 
                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} 
              />
              <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} />
              <Bar name="TW I" dataKey="tw1" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar name="TW II" dataKey="tw2" fill="#60a5fa" radius={[4, 4, 0, 0]} />
              <Bar name="TW III" dataKey="tw3" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar name="TW IV" dataKey="tw4" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-tight">Matriks Realisasi Triwulanan</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase">Kabupaten / Kota</th>
                <th className="px-4 py-4 text-right font-bold text-slate-500 uppercase">Triwulan I</th>
                <th className="px-4 py-4 text-right font-bold text-slate-500 uppercase">Triwulan II</th>
                <th className="px-4 py-4 text-right font-bold text-slate-500 uppercase">Triwulan III</th>
                <th className="px-4 py-4 text-right font-bold text-slate-500 uppercase">Triwulan IV</th>
                <th className="px-4 py-4 text-right font-bold text-indigo-600 uppercase bg-indigo-50/50">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900">{item.kabKota}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium">{formatIDR_Short(item.tw1)}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium">{formatIDR_Short(item.tw2)}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium">{formatIDR_Short(item.tw3)}</td>
                  <td className="px-4 py-4 text-right text-slate-600 font-medium">{formatIDR_Short(item.tw4)}</td>
                  <td className="px-4 py-4 text-right font-black text-indigo-700 bg-indigo-50/20">{formatIDR_Short(item.nilaiInvestasi)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black">
              <tr>
                <td className="px-4 py-4 uppercase">Total Provinsi</td>
                <td className="px-4 py-4 text-right">{formatIDR_Short(tableTotals.tw1)}</td>
                <td className="px-4 py-4 text-right">{formatIDR_Short(tableTotals.tw2)}</td>
                <td className="px-4 py-4 text-right">{formatIDR_Short(tableTotals.tw3)}</td>
                <td className="px-4 py-4 text-right">{formatIDR_Short(tableTotals.tw4)}</td>
                <td className="px-4 py-4 text-right text-emerald-400">{formatIDR_Short(tableTotals.total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default QuarterlyView;
