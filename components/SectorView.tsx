
import React, { useMemo, useState } from 'react';
import { RegencyInvestmentData } from '../types';
import { SECTORS } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend
} from 'recharts';

interface SectorViewProps {
  data: RegencyInvestmentData[];
}

const SectorView: React.FC<SectorViewProps> = ({ data }) => {
  const [selectedSector, setSelectedSector] = useState<string>(SECTORS[0].key);

  const formatIDR_Short = (val: number) => {
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  };

  const sectorAggregate = useMemo(() => {
    return SECTORS.map(s => ({
      name: s.label,
      key: s.key,
      value: data.reduce((sum, item) => sum + (item as any)[s.key], 0)
    })).sort((a, b) => b.value - a.value);
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.kabKota,
      ...SECTORS.reduce((acc, s) => ({ ...acc, [s.key]: (item as any)[s.key] / 1000000000 }), {})
    }));
  }, [data]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#94A3B8'];

  const sectorBreakdownData = useMemo(() => {
    return data.map(item => ({
      name: item.kabKota,
      value: (item as any)[selectedSector] / 1000000000
    })).sort((a, b) => b.value - a.value);
  }, [data, selectedSector]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Sector Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {sectorAggregate.slice(0, 10).map((s, idx) => (
          <div key={s.key} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-200 transition-all">
            <div className="flex items-center space-x-2 mb-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.name}</p>
            </div>
            <h4 className="text-sm font-black text-slate-800">{formatIDR_Short(s.value)}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Stacked Chart */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 mb-8 text-lg uppercase tracking-tight">Komposisi Sektor per Wilayah (Miliar Rp)</h3>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} fontStyle="bold" width={100} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Legend verticalAlign="top" iconType="circle" />
                {SECTORS.map((s, idx) => (
                  <Bar key={s.key} name={s.label} dataKey={s.key} stackId="a" fill={COLORS[idx % COLORS.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focused Sector Analysis */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Fokus Analisis Sektor</h3>
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-xs text-slate-600 outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SECTORS.map(s => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" interval={0} fontSize={9} fontStyle="bold" height={60} />
                <YAxis hide />
                <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                <Bar dataKey="value" fill={COLORS[SECTORS.findIndex(s => s.key === selectedSector) % COLORS.length]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Matrix Table */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-tight">Matriks Realisasi per Sektor</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase">Kabupaten / Kota</th>
                {SECTORS.map(s => (
                  <th key={s.key} className="px-4 py-4 text-right font-bold text-slate-500 uppercase">{s.label}</th>
                ))}
                <th className="px-4 py-4 text-right font-black text-blue-600 uppercase bg-blue-50/50">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900">{item.kabKota}</td>
                  {SECTORS.map(s => (
                    <td key={s.key} className="px-4 py-4 text-right text-slate-600 font-medium">{formatIDR_Short((item as any)[s.key])}</td>
                  ))}
                  <td className="px-4 py-4 text-right font-black text-blue-700 bg-blue-50/20">{formatIDR_Short(item.nilaiInvestasi)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black">
              <tr>
                <td className="px-4 py-4 uppercase">Total Provinsi</td>
                {SECTORS.map(s => (
                  <td key={s.key} className="px-4 py-4 text-right">
                    {formatIDR_Short(data.reduce((sum, item) => sum + (item as any)[s.key], 0))}
                  </td>
                ))}
                <td className="px-4 py-4 text-right text-emerald-400">
                  {formatIDR_Short(data.reduce((sum, item) => sum + item.nilaiInvestasi, 0))}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SectorView;
