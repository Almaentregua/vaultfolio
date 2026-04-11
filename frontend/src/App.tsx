import { Route, Routes } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Investments from "@/pages/Investments";
import AssetTypes from "@/pages/AssetTypes";
import ExchangeRates from "@/pages/ExchangeRates";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/investments" element={<Investments />} />
        <Route path="/asset-types" element={<AssetTypes />} />
        <Route path="/exchange-rates" element={<ExchangeRates />} />
      </Route>
    </Routes>
  );
}
