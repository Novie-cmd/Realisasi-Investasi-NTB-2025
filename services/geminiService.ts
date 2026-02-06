
import { GoogleGenAI } from "@google/genai";
import { RegencyInvestmentData } from "../types";

export const analyzeInvestmentData = async (data: RegencyInvestmentData[]): Promise<string> => {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  
  if (!apiKey) {
    return "Analisis AI tidak tersedia: API_KEY belum dikonfigurasi di variabel lingkungan.";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const summary = data.map(d => ({
    wilayah: d.kabKota,
    totalInvestasi: d.nilaiInvestasi,
    sumberModal: {
        pma: d.pma,
        pmdn: d.pmdn
    },
    sektor: {
      esdm: d.esdm,
      pariwisata: d.pariwisata,
      pertanian: d.pertanian,
      pupr: d.pupr,
      perdagangan: d.perdagangan,
      perhubungan: d.perhubungan,
      telekomunikasi: d.telekomunikasi,
      perindustrian: d.perindustrian,
      lainnya: d.lainnya
    },
    triwulan: {
      TW1: d.tw1,
      TW2: d.tw2,
      TW3: d.tw3,
      TW4: d.tw4
    },
    serapanTKI: d.tki,
    penggunaanTKA: d.tka,
    jumlahProyek: d.jumlahProyek
  }));

  const prompt = `Sebagai analis ekonomi senior Pemerintah Provinsi NTB, analisalah data realisasi investasi tahun 2025 per wilayah, triwulan, dan sumber modal (PMA/PMDN) berikut:
  ${JSON.stringify(summary)}
  
  Berikan analisis singkat dalam Bahasa Indonesia mengenai:
  1. Perbandingan dominasi PMA vs PMDN. Wilayah mana yang paling menarik bagi investor asing?
  2. Tren pertumbuhan antar triwulan.
  3. Efektivitas investasi terhadap penciptaan lapangan kerja (serapan TKI).
  4. Rekomendasi kebijakan untuk menjaga iklim investasi di sisa tahun 2025.
  Gunakan format Markdown untuk jawaban Anda.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    return response.text || "Gagal mendapatkan analisis dari AI.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Terjadi kesalahan saat menghubungi layanan AI. Pastikan API_KEY valid.";
  }
};
