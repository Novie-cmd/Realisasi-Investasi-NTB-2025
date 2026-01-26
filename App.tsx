
import React, { useState, useMemo, useEffect } from 'react';
import { RegencyInvestmentData } from './types';
import { INITIAL_DATA, SECTORS, QUARTERS } from './constants';
import { supabase } from './lib/supabase';
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
  // --- AUTH & USER STATE ---
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // --- APP DATA STATE ---
  const [data, setData] = useState<RegencyInvestmentData[]>(INITIAL_DATA);
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>(INITIAL_DATA[0].id);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // --- AUTH INITIALIZATION ---
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCloudData();
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCloudData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  const fetchCloudData = async () => {
    setIsSyncing(true);
    try {
      const { data: investments, error } = await supabase
        .from('investments')
        .select('*')
        .order('no', { ascending: true });

      if (error) throw error;
      if (investments && investments.length > 0) {
        setData(investments);
      }
    } catch (err) {
      console.error("Gagal mengambil data dari Supabase:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- ACTIONS ---
  const handleGitHubLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setData(INITIAL_DATA); // Reset to default when logout
  };

  const handleSyncToCloud = async (newData: RegencyInvestmentData[]) => {
    if (!user) return alert("Harap login terlebih dahulu untuk menyimpan ke cloud.");
    setIsSyncing(true);
    try {
      const { error } = await supabase
        .from('investments')
        .upsert(newData.map(item => ({ ...item, user_id: user.id })));

      if (error) throw error;
      setData(newData);
      alert("Data berhasil disinkronkan ke Cloud!");
    } catch (err) {
      alert("Gagal sinkronisasi data.");
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.origin + window.location.pathname;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SimInvest NTB 2025', text: 'Dashboard Investasi NTB', url: shareUrl });
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // --- RENDER LOGIN SCREEN ---
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center shadow-2xl shadow-blue-500/40 mb-6">
               <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tight">SimInvest NTB</h1>
            <p className="text-slate-400 font-medium mt-2">Sistem Monitoring Investasi OSS RBA</p>
          </div>
          
          <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-2xl flex flex-col items-center space-y-6">
            <p className="text-slate-400 text-center text-sm font-medium">Harap masuk menggunakan akun GitHub untuk sinkronisasi data cloud.</p>
            
            <button 
              onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-black py-4 rounded-2xl shadow-xl transition-all active:scale-[0.98]"
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              <span>MASUK DENGAN GITHUB</span>
            </button>
          </div>
          <p className="mt-8 text-center text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">Pemerintah Provinsi Nusa Tenggara Barat</p>
        </div>
      </div>
    );
  }

  // --- RENDER MAIN DASHBOARD ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
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

        <div className="pt-6 border-t border-slate-800 mt-auto space-y-2 pb-2">
           <div className="flex items-center space-x-3 px-4 py-3 mb-2 bg-slate-800/50 rounded-xl">
              <img src={user?.user_metadata?.avatar_url} className="w-8 h-8 rounded-full border border-blue-500" alt="Avatar" />
              <div className="overflow-hidden">
                 <p className="text-[10px] font-black truncate">{user?.user_metadata?.full_name}</p>
                 <p className="text-[8px] text-slate-500 truncate uppercase">GitHub Authenticated</p>
              </div>
           </div>

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
             <span>Log Out Akun</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
               <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                 {activeView === 'regency-detail' ? `Detail: ${selectedRegency.kabKota}` : 'Ringkasan Investasi 2025'}
               </h2>
               {isSyncing && <span className="px-2 py-1 bg-blue-100 text-blue-700 text-[9px] font-black rounded-lg border border-blue-200 uppercase animate-pulse">Syncing Cloud...</span>}
            </div>
            <p className="text-slate-500 font-medium text-sm italic">Monitoring Realisasi Berdasarkan OSS RBA Provinsi NTB</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <button onClick={fetchCloudData} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
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
        <ImportModal onClose={() => setIsImportOpen(false)} onImport={handleSyncToCloud} />
      )}
    </div>
  );
};

export default App;
