import axios from "axios";
import { downloadCsv } from "@/lib/utils";
import type {
  AssetType,
  CreateAssetTypeData,
  CreateExchangeRateData,
  CreateInvestmentData,
  ExchangeRate,
  Investment,
  InvestmentRecord,
  PortfolioHistory,
  PortfolioSummary,
  UpdateInvestmentData,
} from "@/types";

const http = axios.create({
  baseURL: "/api",
  headers: { "Content-Type": "application/json" },
});

// ── Asset Types ───────────────────────────────────────────────────────────────

export const assetTypesApi = {
  list: () => http.get<AssetType[]>("/asset-types/").then((r) => r.data),
  get: (id: number) =>
    http.get<AssetType>(`/asset-types/${id}`).then((r) => r.data),
  create: (data: CreateAssetTypeData) =>
    http.post<AssetType>("/asset-types/", data).then((r) => r.data),
  update: (id: number, data: Partial<CreateAssetTypeData>) =>
    http.patch<AssetType>(`/asset-types/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/asset-types/${id}`),
};

// ── Investments ───────────────────────────────────────────────────────────────

export const investmentsApi = {
  list: (activeOnly = true) =>
    http
      .get<Investment[]>("/investments/", { params: { active_only: activeOnly } })
      .then((r) => r.data),
  get: (id: number) =>
    http.get<Investment>(`/investments/${id}`).then((r) => r.data),
  create: (data: CreateInvestmentData) =>
    http.post<Investment>("/investments/", data).then((r) => r.data),
  update: (id: number, data: UpdateInvestmentData) =>
    http.patch<Investment>(`/investments/${id}`, data).then((r) => r.data),
  delete: (id: number) => http.delete(`/investments/${id}`),

  // Records (value history)
  listRecords: (id: number) =>
    http
      .get<InvestmentRecord[]>(`/investments/${id}/records`)
      .then((r) => r.data),
  addRecord: (
    id: number,
    data: { amount: number; recorded_at: string; note?: string }
  ) =>
    http
      .post<InvestmentRecord>(`/investments/${id}/records`, data)
      .then((r) => r.data),
  deleteRecord: (invId: number, recordId: number) =>
    http.delete(`/investments/${invId}/records/${recordId}`),
};

// ── Portfolio ─────────────────────────────────────────────────────────────────

export const portfolioApi = {
  summary: (currency = "USD") =>
    http
      .get<PortfolioSummary>("/portfolio/summary", { params: { currency } })
      .then((r) => r.data),
  history: (currency = "USD", days = 90) =>
    http
      .get<PortfolioHistory>("/portfolio/history", {
        params: { currency, days },
      })
      .then((r) => r.data),
};

// ── Exports ───────────────────────────────────────────────────────────────────

export const exportsApi = {
  /** Descarga todas las inversiones (activas e inactivas) con su valor actual. */
  investments: () =>
    downloadCsv("/api/exports/investments.csv", "inversiones.csv"),

  /** Descarga el historial de registros. Si se pasa `investmentId`, filtra por esa inversión. */
  records: (investmentId?: number) => {
    const url = investmentId
      ? `/api/exports/records.csv?investment_id=${investmentId}`
      : "/api/exports/records.csv";
    return downloadCsv(url, "registros.csv");
  },

  /** Descarga el resumen del portfolio convertido a la moneda indicada. */
  portfolio: (currency = "USD") =>
    downloadCsv(
      `/api/exports/portfolio.csv?currency=${currency}`,
      `portfolio_${currency}.csv`
    ),

  /** Descarga los tipos de cambio almacenados. Si se pasa `base`, filtra por moneda base. */
  exchangeRates: (base?: string) => {
    const url = base
      ? `/api/exports/exchange-rates.csv?base=${base}`
      : "/api/exports/exchange-rates.csv";
    return downloadCsv(url, "tipos_de_cambio.csv");
  },
};

// ── Exchange Rates ────────────────────────────────────────────────────────────

export const exchangeRatesApi = {
  list: (base?: string) =>
    http
      .get<ExchangeRate[]>("/exchange-rates/", { params: { base } })
      .then((r) => r.data),
  create: (data: CreateExchangeRateData) =>
    http.post<ExchangeRate>("/exchange-rates/", data).then((r) => r.data),
  fetch: (baseCurrency = "USD", targetCurrencies?: string[]) =>
    http
      .post<{ message: string; count: number }>("/exchange-rates/fetch", {
        base_currency: baseCurrency,
        target_currencies: targetCurrencies,
      })
      .then((r) => r.data),
};
