
import React from 'react';
import { RegencyInvestmentData } from '../types';
import { SECTORS, QUARTERS } from '../constants';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from 'recharts';

interface RegencyDetailProps {
  regency: RegencyInvestmentData;
}

const RegencyDetail: React.FC<RegencyDetailProps> = ({ regency }) => {
  const sectorData = SECTORS.map(s => ({
    name: s.label,
    value: (regency as any)[s.key]
  })).filter(s => s.value > 0).sort((a, b) => b.value - a.value);

  const quarterlyData = QUARTERS.map(q => ({
    name: q.label,
    value: (regency as any)[q.key]
  }));

  const pmaPmdnData = [
    { name: 'PMA', value: regency.pma },
    { name: 'PMDN', value: regency.pmdn }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#94A3B8'];
  const PMA_PMDN_COLORS = ['#ef4444', '#3b82f6'];

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

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{regency.kabKota}</h3>
            <p className="text-slate-500 font-medium">Profil Detail Realisasi Investasi 2025</p>
          </div>
          <div className="px-6 py-3 bg-emerald-50 rounded-2xl border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Realisasi</p>
            <p className="text-xl font-black text-emerald-700">{formatIDR(regency.nilaiInvestasi)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sector Breakdown Chart - Changed to BarChart */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Distribusi Sektor</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sectorData} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    fontSize={9} 
                    width={80} 
                    tickLine={false} 
                    axisLine={false} 
                    fontStyle="bold"
                  />
                  <Tooltip 
                    formatter={(value: number) => [formatIDR_Short(value), 'Nilai']}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quarterly Trend Chart */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Realisasi per Triwulan</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={quarterlyData}>
                  <defs>
                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip formatter={(value: number) => [formatIDR(value), 'Realisasi']} />
                  <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* PMA vs PMDN Pie */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Sumber Modal</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pmaPmdnData}
                    cx="50%"
                    cy="50%"
                    innerRadius={0}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                  >
                    {pmaPmdnData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PMA_PMDN_COLORS[index % PMA_PMDN_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatIDR(value), 'Nilai']} />
                  <Legend verticalAlign="bottom" iconType="rect" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUARTERS.map((q) => (
              <div key={q.key} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{q.label}</p>
                <p className="text-sm font-black text-slate-800">{formatIDR_Short((regency as any)[q.key])}</p>
              </div>
            ))}
        </div>

        {/* Labor & Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-8">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Proyek</p>
              <p className="text-3xl font-black text-slate-800">{regency.jumlahProyek}</p>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
              <p className="text-xs font-bold text-blue-400 uppercase mb-2">TKI</p>
              <p className="text-3xl font-black text-blue-700">{regency.tki.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
              <p className="text-xs font-bold text-rose-400 uppercase mb-2">TKA</p>
              <p className="text-3xl font-black text-rose-700">{regency.tka.toLocaleString()}</p>
            </div>
            <div className="p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Rasio TKI/TKA</p>
              <p className="text-3xl font-black text-indigo-700">
                {regency.tka > 0 ? (regency.tki / regency.tka).toFixed(1) : '∞'}:1
              </p>
            </div>
        </div>

        {/* Detailed Sector Breakdown */}
        <div className="mt-12">
          <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Detail Nilai per Sektor</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {SECTORS.map((s, idx) => (
              <div key={s.key} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                   <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[idx % COLORS.length]}}></div>
                   <p className="text-[10px] font-bold text-slate-500 uppercase">{s.label}</p>
                </div>
                <p className="text-xs font-bold text-slate-800">{formatIDR((regency as any)[s.key])}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegencyDetail;
