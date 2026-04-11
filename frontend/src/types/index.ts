export interface AssetType {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  color: string;
  icon: string;
  created_at: string;
  investment_count: number;
}

export interface Investment {
  id: number;
  name: string;
  asset_type_id: number;
  asset_type: AssetType;
  platform: string | null;
  currency: string;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  current_amount: number | null;
  last_recorded_at: string | null;
}

export interface InvestmentRecord {
  id: number;
  investment_id: number;
  amount: number;
  recorded_at: string;
  note: string | null;
  created_at: string;
}

export interface ExchangeRate {
  id: number;
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
}

// Portfolio

export interface InvestmentSummary {
  id: number;
  name: string;
  asset_type_name: string;
  asset_type_color: string;
  platform: string | null;
  currency: string;
  current_amount: number;
  current_amount_converted: number;
  target_currency: string;
}

export interface AssetTypeBreakdown {
  asset_type_id: number;
  asset_type_name: string;
  asset_type_color: string;
  total_converted: number;
  percentage: number;
  investment_count: number;
}

export interface CurrencyBreakdown {
  currency: string;
  total_original: number;
  total_converted: number;
  percentage: number;
}

export interface PortfolioSummary {
  target_currency: string;
  total_net_worth: number;
  by_asset_type: AssetTypeBreakdown[];
  by_currency: CurrencyBreakdown[];
  investments: InvestmentSummary[];
}

export interface PortfolioHistoryPoint {
  date: string;
  total_converted: number;
  target_currency: string;
}

export interface PortfolioHistory {
  target_currency: string;
  history: PortfolioHistoryPoint[];
}

// API request shapes

export interface CreateAssetTypeData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
}

export interface CreateInvestmentData {
  name: string;
  asset_type_id: number;
  platform?: string;
  currency: string;
  notes?: string;
  initial_amount?: number;
  initial_date?: string;
}

export interface UpdateInvestmentData {
  name?: string;
  asset_type_id?: number;
  platform?: string;
  currency?: string;
  notes?: string;
  is_active?: boolean;
}

export interface CreateExchangeRateData {
  base_currency: string;
  target_currency: string;
  rate: number;
  date: string;
}

export const COMMON_CURRENCIES = [
  "USD",
  "EUR",
  "CLP",
  "ARS",
  "BRL",
  "MXN",
  "COP",
  "PEN",
  "UYU",
  "GBP",
  "JPY",
  "CHF",
  "BTC",
  "ETH",
];
