
import React, { useState, useMemo, useEffect } from 'react';
import { RegencyInvestmentData } from './types';
import { INITIAL_DATA, SECTORS, QUARTERS } from './constants';
import StatsCard from './components/StatsCard';
import InvestmentTable from './components/InvestmentTable';
import ImportModal from './components/ImportModal';
import RegencyDetail from './components/RegencyDetail';
import QuarterlyView from './components/QuarterlyView';
import PmaPmdnView from './components/PmaPmdnView';
import SectorView from './components/SectorView';
import { analyzeInvestmentData } from './services/geminiService';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis
} from 'recharts';

type ActiveView = 'dashboard' | 'regency-detail' | 'quarterly' | 'pma-pmdn' | 'sectors';

const App: React.FC = () => {
  // --- SESSION CONSTANTS ---
  const SESSION_KEY = 'SIMINVEST_SESSION_TOKEN';

  // --- AUTHENTICATION STATE ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem(SESSION_KEY) === 'active_session';
  });
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');

  // --- APP DATA STATE ---
  const [data, setData] = useState<RegencyInvestmentData[]>(INITIAL_DATA);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>(INITIAL_DATA[0].id);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCustomData, setIsCustomData] = useState(false);

  // Load URL data if shared
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get('d');
    if (encodedData) {
      try {
        const decodedData = JSON.parse(atob(encodedData));
        if (Array.isArray(decodedData)) {
          setData(decodedData);
          setIsCustomData(true);
        }
      } catch (e) {
        console.error("URL Data Error", e);
      }
    }
  }, []);

  // --- ACTIONS ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple verification (admin/admin)
    if (loginData.username.toLowerCase() === 'admin' && loginData.password === 'admin') {
      localStorage.setItem(SESSION_KEY, 'active_session');
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError("Username atau Password salah! (Gunakan: admin/admin)");
    }
  };

  const handleLogout = () => {
    // Immediate clear and state update
    localStorage.removeItem(SESSION_KEY);
    setIsLoggedIn(false);
    // Reset view
    setActiveView('dashboard');
    setLoginData({ username: '', password: '' });
    // Clear URL params if custom data
    if (isCustomData) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  const handleShare = async () => {
    let shareUrl = window.location.origin + window.location.pathname;
    if (isCustomData) {
      shareUrl += `?d=${btoa(JSON.stringify(data))}`;
    }
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SimInvest NTB 2025', text: 'Data Investasi NTB', url: shareUrl });
      } catch (err) { console.error('Share Error', err); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link dashboard telah disalin!');
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const res = await analyzeInvestmentData(data);
      setAiAnalysis(res);
    } catch (e) {
      setAiAnalysis("Maaf, layanan analisis sedang sibuk.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // --- COMPUTED ---
  const stats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      totalInvestasi: acc.totalInvestasi + curr.nilaiInvestasi,
      totalTKA: acc.totalTKA + curr.tka,
      totalTKI: acc.totalTKI + curr.tki,
      totalProyek: acc.totalProyek + curr.jumlahProyek,
    }), { totalInvestasi: 0, totalTKA: 0, totalTKI: 0, totalProyek: 0 });
  }, [data]);

  const selectedRegency = useMemo(() => {
    return data.find(r => r.id === selectedRegencyId) || data[0];
  }, [data, selectedRegencyId]);

  const regencyChartData = data.map(item => ({
    name: item.kabKota,
    value: item.nilaiInvestasi / 1000000000
  })).sort((a, b) => b.value - a.value);

  const sectorChartData = SECTORS.map(s => ({
    subject: s.label,
    A: data.reduce((sum, item) => sum + (item as any)[s.key], 0) / 1000000000,
    fullMark: 150
  }));

  const formatIDR_Short = (val: number) => {
    if (val >= 1000000000000) return `Rp ${(val / 1000000000000).toFixed(2)} T`;
    if (val >= 1000000000) return `Rp ${(val / 1000000000).toFixed(2)} M`;
    return `Rp ${val.toLocaleString()}`;
  };

  // --- RENDER LOGIN SCREEN ---
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">SimInvest NTB</h1>
            <p className="text-slate-400 font-medium mt-2">Sistem Monitoring Investasi - Tahun 2025</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl">
            {loginError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl text-center">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Username</label>
                <input 
                  type="text" 
                  required
                  value={loginData.username}
                  onChange={(e) => setLoginData({...loginData, username: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="Masukkan username (admin)"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 px-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginData.password}
                  onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-600" 
                  placeholder="•••••••• (admin)"
                />
              </div>
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] mt-2"
              >
                MASUK APLIKASI
              </button>
            </form>
          </div>
          <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Pemerintah Provinsi Nusa Tenggara Barat</p>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 md:sticky md:top-0 md:h-screen flex flex-col z-30 shadow-2xl print:hidden">
        <div className="flex items-center space-x-3 mb-10 px-2">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div>
            <h1 className="text-lg font-black leading-tight tracking-tight">SimInvest</h1>
            <p className="text-[9px] text-blue-400 font-bold tracking-widest uppercase">DPMPTSP NTB</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
          <button onClick={() => setActiveView('dashboard')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${activeView === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
          </button>
          <button onClick={() => setActiveView('quarterly')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${activeView === 'quarterly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Triwulan</span>
          </button>
          <button onClick={() => setActiveView('sectors')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${activeView === 'sectors' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Sektor</span>
          </button>
          <button onClick={() => setActiveView('pma-pmdn')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${activeView === 'pma-pmdn' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Modal</span>
          </button>
          <button onClick={() => setActiveView('regency-detail')} className={`w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 transition-all ${activeView === 'regency-detail' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg>
             <span className="text-xs font-bold uppercase tracking-wider">Wilayah</span>
          </button>
        </nav>

        {/* Action Buttons Section */}
        <div className="pt-6 border-t border-slate-800 mt-auto space-y-2 pb-2">
           <button 
             onClick={() => setIsImportOpen(true)}
             className="w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-emerald-400 hover:bg-emerald-500/10 transition-all font-bold text-xs uppercase"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
             <span>Import Data</span>
           </button>
           
           <button 
             onClick={handleLogout}
             className="w-full text-left px-4 py-3 rounded-xl flex items-center space-x-3 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all font-bold text-xs uppercase"
           >
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             <span>Keluar Sesi</span>
           </button>
           
           <div className="px-4 py-2">
             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">© 2025 SimInvest NTB</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                 {activeView === 'regency-detail' ? `Detail: ${selectedRegency.kabKota}` : 'Ringkasan Investasi 2025'}
               </h2>
               {isCustomData && <span className="px-2 py-1 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg border border-amber-200 uppercase">Data Impor</span>}
            </div>
            <p className="text-slate-500 font-medium text-sm italic">Monitoring Realisasi Berdasarkan OSS RBA Provinsi NTB</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            {activeView === 'regency-detail' && (
              <select 
                value={selectedRegencyId}
                onChange={(e) => setSelectedRegencyId(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 font-bold text-sm text-slate-700 outline-none shadow-sm focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {data.map(r => <option key={r.id} value={r.id}>{r.kabKota}</option>)}
              </select>
            )}
            <button onClick={handleShare} className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-xs hover:bg-blue-100 transition-all">Bagikan Link</button>
            <button onClick={runAIAnalysis} disabled={isAnalyzing} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all">
              {isAnalyzing ? 'Menganalisis...' : 'Analisis Ekonomi AI'}
            </button>
          </div>
        </header>

        {aiAnalysis && (
          <div className="mb-8 bg-white p-8 rounded-[2rem] shadow-xl border-l-8 border-indigo-500 relative animate-in fade-in slide-in-from-top-4 duration-500">
            <button onClick={() => setAiAnalysis("")} className="absolute top-6 right-6 text-slate-300 hover:text-slate-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg></div>
              <span>Analisis Senior Gemini AI</span>
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed font-medium">
              {aiAnalysis}
            </div>
          </div>
        )}

        <div className="min-h-[60vh] pb-10">
          {activeView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatsCard title="Total Realisasi" value={formatIDR_Short(stats.totalInvestasi)} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"></path></svg>} color="bg-emerald-600" />
                <StatsCard title="Jumlah Proyek" value={stats.totalProyek} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path></svg>} color="bg-blue-600" />
                <StatsCard title="Serapan TKI" value={stats.totalTKI.toLocaleString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} color="bg-indigo-600" />
                <StatsCard title="Tenaga Kerja Asing" value={stats.totalTKA.toLocaleString()} icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9"></path></svg>} color="bg-rose-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 mb-8 text-sm uppercase tracking-[0.15em] flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Investasi per Wilayah (Miliar)</span>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regencyChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={10} width={100} tickLine={false} axisLine={false} fontStyle="bold" />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} barSize={18} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                  <h3 className="font-black text-slate-800 mb-8 text-sm uppercase tracking-[0.15em] flex items-center space-x-2">
                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                    <span>Proporsi Sektor Utama</span>
                  </h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectorChartData}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" fontSize={9} fontStyle="bold" />
                        <Radar name="Investasi" dataKey="A" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <InvestmentTable data={data} />
            </>
          )}

          {activeView === 'quarterly' && <QuarterlyView data={data} />}
          {activeView === 'sectors' && <SectorView data={data} />}
          {activeView === 'pma-pmdn' && <PmaPmdnView data={data} />}
          {activeView === 'regency-detail' && <RegencyDetail regency={selectedRegency} />}
        </div>
      </main>

      {isImportOpen && (
        <ImportModal onClose={() => setIsImportOpen(false)} onImport={(d) => { setData(d); setIsCustomData(true); }} />
      )}
    </div>
  );
};

export default App;
