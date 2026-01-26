
export interface RegencyInvestmentData {
  id: string;
  no: number;
  kabKota: string;
  // Specific Sectors from 2025 Data
  esdm: number;
  pariwisata: number;
  pertanian: number;
  pupr: number;
  perdagangan: number;
  perhubungan: number;
  telekomunikasi: number;
  perindustrian: number;
  lainnya: number; // Added to handle discrepancies between sector sum and total
  
  nilaiInvestasi: number;
  tw1: number;
  tw2: number;
  tw3: number;
  tw4: number;
  pma: number;
  pmdn: number;
  tka: number;
  tki: number;
  jumlahProyek: number;
}

export interface GlobalStats {
  totalInvestasi: number;
  totalTKA: number;
  totalTKI: number;
  totalProyek: number;
}
