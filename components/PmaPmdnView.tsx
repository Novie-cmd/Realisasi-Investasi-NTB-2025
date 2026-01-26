
import React, { useMemo } from 'react';
import { RegencyInvestmentData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, PieChart, Pie, Cell
} from 'recharts';

interface PmaPmdnViewProps {
  data: RegencyInvestmentData[];
}

const PmaPmdnView: React.FC<PmaPmdnViewProps> = ({ data }) => {
  const totals = useMemo(() => {
    return data.reduce((acc, curr) => ({
      pma: acc.pma + curr.pma,
      pmdn: acc.pmdn + curr.pmdn,
      total: acc.total + curr.nilaiInvestasi
    }), { pma: 0, pmdn: 0, total: 0 });
  }, [data]);

  const chartData = useMemo(() => {
    return data.map(item => ({
      name: item.kabKota,
      pma: item.pma / 1000000000,
      pmdn: item.pmdn / 1000000000,
    })).sort((a, b) => (b.pma + b.pmdn) - (a.pma + a.pmdn));
  }, [data]);

  const pieData = [
    { name: 'PMA (Asing)', value: totals.pma },
    { name: 'PMDN (Dalam Negeri)', value: totals.pmdn },
  ];

  const COLORS = ['#ef4444', '#3b82f6'];

  const formatIDR_Short = (val: number) => {
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total PMA (Asing)</p>
            <h4 className="text-2xl font-black text-rose-600">{formatIDR_Short(totals.pma)}</h4>
            <div className="mt-2 text-xs font-bold text-slate-500">
                {((totals.pma / totals.total) * 100).toFixed(1)}% dari Total Investasi
            </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total PMDN (Lokal)</p>
            <h4 className="text-2xl font-black text-blue-600">{formatIDR_Short(totals.pmdn)}</h4>
            <div className="mt-2 text-xs font-bold text-slate-500">
                {((totals.pmdn / totals.total) * 100).toFixed(1)}% dari Total Investasi
            </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center">
            <div className="h-28 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={45}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(val: number) => formatIDR_Short(val)} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
            <div className="ml-2 space-y-1">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                    <span className="text-[10px] font-bold text-slate-500">PMA</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-slate-500">PMDN</span>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <h3 className="font-black text-slate-800 mb-8 text-lg uppercase tracking-tight">Perbandingan PMA vs PMDN per Wilayah (Miliar Rp)</h3>
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
              <Bar name="PMA (Asing)" dataKey="pma" fill="#ef4444" radius={[4, 4, 0, 0]} />
              <Bar name="PMDN (Lokal)" dataKey="pmdn" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-tight">Tabel Rincian PMA & PMDN</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-4 text-left font-bold text-slate-500 uppercase">Kabupaten / Kota</th>
                <th className="px-4 py-4 text-right font-bold text-rose-600 uppercase">PMA (Asing)</th>
                <th className="px-4 py-4 text-right font-bold text-blue-600 uppercase">PMDN (Lokal)</th>
                <th className="px-4 py-4 text-right font-bold text-slate-800 uppercase bg-slate-100/50">Total</th>
                <th className="px-4 py-4 text-center font-bold text-slate-500 uppercase">% PMA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {data.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-4 font-bold text-slate-900">{item.kabKota}</td>
                  <td className="px-4 py-4 text-right text-rose-600 font-bold">{formatIDR_Short(item.pma)}</td>
                  <td className="px-4 py-4 text-right text-blue-600 font-bold">{formatIDR_Short(item.pmdn)}</td>
                  <td className="px-4 py-4 text-right font-black text-slate-800 bg-slate-50/20">{formatIDR_Short(item.nilaiInvestasi)}</td>
                  <td className="px-4 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded-full font-bold text-slate-600">
                        {((item.pma / item.nilaiInvestasi) * 100).toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-900 text-white font-black">
              <tr>
                <td className="px-4 py-4 uppercase">Total Provinsi</td>
                <td className="px-4 py-4 text-right text-rose-400">{formatIDR_Short(totals.pma)}</td>
                <td className="px-4 py-4 text-right text-blue-400">{formatIDR_Short(totals.pmdn)}</td>
                <td className="px-4 py-4 text-right text-emerald-400">{formatIDR_Short(totals.total)}</td>
                <td className="px-4 py-4 text-center">
                    {((totals.pma / totals.total) * 100).toFixed(1)}%
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PmaPmdnView;
