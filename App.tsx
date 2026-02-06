
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
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // --- LOGIN FORM STATE ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        if (session?.user) fetchCloudData();
      } catch (err) {
        console.error("Auth Error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchCloudData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  const fetchCloudData = async () => {
    if (isDemoMode) return;
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

  // --- AUTH ACTIONS ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message || "Email atau password salah.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGitHubLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin }
      });
      if (error) throw error;
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setIsDemoMode(false);
    setData(INITIAL_DATA);
    setActiveView('dashboard');
  };

  // --- OTHER ACTIONS ---
  const handleSyncToCloud = async (newData: RegencyInvestmentData[]) => {
    if (isDemoMode) return alert("Mode Demo tidak dapat menyimpan ke Cloud.");
    if (!user) return alert("Harap login terlebih dahulu.");
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
    const shareUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'SimInvest NTB 2025', text: 'Dashboard Investasi Provinsi NTB', url: shareUrl });
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
      setAiAnalysis("Layanan analisis sedang sibuk.");
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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">Menghubungkan ke Pusat Data...</p>
      </div>
    );
  }

  // --- LOGIN UI ---
  if (!user && !isDemoMode) {
    return (
      <div className="min-h-screen bg-animate flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full"></div>
        </div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl mx-auto flex items-center justify-center shadow-xl mb-4">
               <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">SimInvest <span className="text-blue-400">NTB</span></h1>
            <p className="text-slate-400 text-sm font-medium">Monitoring Realisasi Investasi 2025</p>
          </div>
          
          <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl">
            <h2 className="text-white text-xl font-bold mb-6 text-center">Form Login Aplikasi</h2>
            
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="admin@ntbprov.go.id"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>

              {authError && <p className="text-rose-400 text-xs font-bold bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">{authError}</p>}

              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLoggingIn ? 'MEMPROSES...' : 'MASUK KE DASHBOARD'}
              </button>
            </form>

            <div className="flex items-center my-6 space-x-3">
              <div className="flex-1 h-[1px] bg-white/5"></div>
              <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Atau Login Sosial</span>
              <div className="flex-1 h-[1px] bg-white/5"></div>
            </div>

            <button 
              onClick={handleGitHubLogin}
              className="w-full flex items-center justify-center space-x-3 bg-white hover:bg-slate-100 text-slate-900 font-bold py-3.5 rounded-xl transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
              <span>Login dengan GitHub</span>
            </button>
            
            <div className="mt-8 pt-4 border-t border-white/5 text-center">
              <button 
                onClick={() => setIsDemoMode(true)}
                className="text-blue-400 hover:text-blue-300 text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-center mx-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                Masuk sebagai Tamu (Mode Demo)
              </button>
            </div>
          </div>
          
          <p className="mt-6 text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            DPMPTSP PROVINSI NTB &bull; VERSI 2025.1
          </p>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <aside className="w-full md:w-72 bg-slate-900 text-white p-6 md:sticky md:top-0 md:h-screen flex flex-col z-30 shadow-2xl print:hidden">
        <div className="flex items-center space-x-4 mb-12 px-2">
          <div className="w-12 h-12 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
          </div>
          <div>
            <h1 className="text-xl font-black leading-tight tracking-tight">SimInvest</h1>
            <p className="text-[10px] text-blue-400 font-bold tracking-[0.2em] uppercase">Provinsi NTB</p>
          </div>
        </div>

        <nav className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
            { id: 'quarterly', label: 'Analisis Triwulan', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
            { id: 'sectors', label: 'Statistik Sektor', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'pma-pmdn', label: 'Sumber Modal', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
            { id: 'regency-detail', label: 'Detail Wilayah', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' }
          ].map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveView(item.id as ActiveView)} 
              className={`w-full text-left px-5 py-4 rounded-2xl flex items-center space-x-4 transition-all duration-300 ${activeView === item.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
            >
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={item.icon}></path></svg>
               <span className="text-xs font-extrabold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="pt-8 border-t border-slate-800 mt-auto space-y-3 pb-4">
           {!isDemoMode ? (
             <div className="flex items-center space-x-4 px-5 py-4 mb-4 bg-slate-800/40 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                <img src={user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=User+NTB'} className="w-10 h-10 rounded-xl border-2 border-blue-500 p-0.5" alt="Avatar" />
                <div className="overflow-hidden">
                   <p className="text-[11px] font-black text-white truncate">{user?.user_metadata?.full_name || user?.email || 'Admin NTB'}</p>
                   <p className="text-[9px] text-emerald-400 font-bold tracking-widest uppercase flex items-center">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                      Terverifikasi
                   </p>
                </div>
             </div>
           ) : (
             <div className="px-5 py-4 mb-4 bg-amber-500/10 rounded-[1.5rem] border border-amber-500/20 flex items-center space-x-4">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-black">?</div>
                <div>
                   <p className="text-[11px] font-black text-amber-500">Mode Demo</p>
                   <p className="text-[9px] text-amber-400/60 font-bold uppercase">Tanpa Sinkronisasi</p>
                </div>
             </div>
           )}

           <button 
             onClick={() => setIsImportOpen(true)}
             disabled={isDemoMode}
             className={`w-full text-left px-5 py-4 rounded-2xl flex items-center space-x-4 transition-all font-extrabold text-xs uppercase ${isDemoMode ? 'opacity-30 grayscale cursor-not-allowed' : 'text-emerald-400 hover:bg-emerald-500/10'}`}
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
             <span>Update Data</span>
           </button>
           
           <button 
             onClick={handleLogout}
             className="w-full text-left px-5 py-4 rounded-2xl flex items-center space-x-4 text-rose-400 hover:bg-rose-500/10 transition-all font-extrabold text-xs uppercase"
           >
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             <span>Keluar Sistem</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-12 overflow-y-auto bg-slate-50/50">
        <header className="flex flex-col xl:flex-row xl:items-center justify-between mb-12 gap-8">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
               <h2 className="text-4xl font-black text-slate-800 tracking-tight leading-tight">
                 {activeView === 'regency-detail' ? `Detail: ${selectedRegency.kabKota}` : 'Realisasi Investasi 2025'}
               </h2>
               {isDemoMode && (
                 <span className="px-4 py-1.5 bg-amber-100 text-amber-700 text-[10px] font-black rounded-full border border-amber-200 uppercase tracking-widest">
                   Mode Demo
                 </span>
               )}
               {isSyncing && (
                 <span className="px-4 py-1.5 bg-blue-100 text-blue-700 text-[10px] font-black rounded-full border border-blue-200 uppercase tracking-widest animate-pulse">
                   Sinkronisasi...
                 </span>
               )}
            </div>
            <p className="text-slate-400 font-semibold text-base italic flex items-center">
               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
               Data konsolidasi resmi DPMPTSP Provinsi Nusa Tenggara Barat
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 print:hidden">
            {!isDemoMode && (
              <button 
                onClick={fetchCloudData} 
                className="p-3 bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm hover:shadow-md active:scale-95"
                title="Muat Ulang Data"
              >
                  <svg className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              </button>
            )}
            
            {activeView === 'regency-detail' && (
              <select 
                value={selectedRegencyId}
                onChange={(e) => setSelectedRegencyId(e.target.value)}
                className="bg-white border-2 border-slate-200 rounded-2xl px-6 py-3 font-extrabold text-sm text-slate-700 outline-none shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2012%2012%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M2.5%204.5L6%208L9.5%204.5%22%20stroke%3D%22%2364748B%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:12px_12px] bg-[right_1.5rem_center] bg-no-repeat pr-12"
              >
                {data.map(r => <option key={r.id} value={r.id}>{r.kabKota}</option>)}
              </select>
            )}
            
            <button onClick={handleShare} className="px-6 py-3 bg-blue-50 text-blue-600 border-2 border-blue-100 rounded-2xl font-black text-xs hover:bg-blue-100 transition-all uppercase tracking-widest">Bagikan</button>
            
            <button 
              onClick={runAIAnalysis} 
              disabled={isAnalyzing} 
              className="group px-8 py-3 bg-gradient-to-tr from-indigo-700 to-blue-600 hover:from-indigo-600 hover:to-blue-500 text-white rounded-2xl font-black text-xs shadow-xl shadow-indigo-500/30 disabled:opacity-50 transition-all flex items-center space-x-3 uppercase tracking-widest"
            >
              <svg className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : 'group-hover:rotate-12 transition-transform'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
              <span>{isAnalyzing ? 'AI Berpikir...' : 'Analisis Ekonomi AI'}</span>
            </button>
          </div>
        </header>

        {aiAnalysis && (
          <div className="mb-12 bg-white p-10 rounded-[3rem] shadow-2xl border-l-[12px] border-indigo-600 relative animate-in fade-in slide-in-from-top-6 duration-700">
            <button onClick={() => setAiAnalysis("")} className="absolute top-8 right-8 p-2 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center space-x-4">
              <div className="p-3 bg-indigo-100 rounded-2xl text-indigo-600 shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
              </div>
              <span className="tracking-tight">Analisis Ekonomi Gemini AI 2025</span>
            </h3>
            <div className="prose prose-slate max-w-none text-slate-600 text-lg leading-relaxed font-medium">
              <div className="whitespace-pre-wrap">{aiAnalysis}</div>
            </div>
          </div>
        )}

        <div className="min-h-[70vh] pb-16">
          {activeView === 'dashboard' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                <StatsCard title="Total Realisasi" value={formatIDR_Short(stats.totalInvestasi)} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2"></path></svg>} color="bg-emerald-600" />
                <StatsCard title="Jumlah Proyek" value={stats.totalProyek.toLocaleString()} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"></path></svg>} color="bg-blue-600" />
                <StatsCard title="Tenaga Kerja Lokal" value={stats.totalTKI.toLocaleString()} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} color="bg-indigo-600" />
                <StatsCard title="Tenaga Kerja Asing" value={stats.totalTKA.toLocaleString()} icon={<svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197"></path></svg>} color="bg-rose-600" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-12">
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-500">
                  <h3 className="font-black text-slate-800 mb-10 text-sm uppercase tracking-[0.2em] flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full shadow-lg shadow-blue-500/40"></div>
                    <span>Investasi Terbesar per Wilayah (Miliar)</span>
                  </h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={regencyChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" fontSize={11} width={120} tickLine={false} axisLine={false} fontStyle="bold" />
                        <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)'}} />
                        <Bar dataKey="value" fill="#2563eb" radius={[0, 12, 12, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-500">
                  <h3 className="font-black text-slate-800 mb-10 text-sm uppercase tracking-[0.2em] flex items-center space-x-3">
                    <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full shadow-lg shadow-indigo-500/40"></div>
                    <span>Keseimbangan Fokus Sektor Utama</span>
                  </h3>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={sectorChartData}>
                        <PolarGrid stroke="#e2e8f0" strokeWidth={1} />
                        <PolarAngleAxis dataKey="subject" fontSize={10} fontStyle="bold" stroke="#64748b" />
                        <Radar name="Investasi" dataKey="A" stroke="#4f46e5" strokeWidth={3} fill="#4f46e5" fillOpacity={0.5} />
                        <Tooltip contentStyle={{borderRadius: '20px'}} />
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

      {isImportOpen && !isDemoMode && (
        <ImportModal onClose={() => setIsImportOpen(false)} onImport={handleSyncToCloud} />
      )}
    </div>
  );
};

export default App;
