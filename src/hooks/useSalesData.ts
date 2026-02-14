import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SalesRecord {
  id: string;
  date: string;
  store_id: string;
  store_name: string | null;
  product_id: string;
  product_name: string | null;
  category: string | null;
  region: string | null;
  sales: number;
  price: number;
  discount: number | null;
  holiday: boolean | null;
  promotion: boolean | null;
  inventory: number | null;
  day_of_week: number | null;
  month: number | null;
  year: number | null;
}

export function useSalesData() {
  return useQuery({
    queryKey: ["sales-data"],
    queryFn: async (): Promise<SalesRecord[]> => {
      // Fetch in batches to handle >1000 rows
      const allData: SalesRecord[] = [];
      let from = 0;
      const batchSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("sales_data")
          .select("*")
          .order("date", { ascending: true })
          .range(from, from + batchSize - 1);
        if (error) throw error;
        if (!data || data.length === 0) break;
        allData.push(...(data as SalesRecord[]));
        if (data.length < batchSize) break;
        from += batchSize;
      }
      return allData;
    },
  });
}

export function useStoreList() {
  return useQuery({
    queryKey: ["store-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_data")
        .select("store_id, store_name")
        .order("store_id");
      if (error) throw error;
      const unique = new Map<string, string>();
      (data || []).forEach((r: any) => {
        if (!unique.has(r.store_id)) unique.set(r.store_id, r.store_name || r.store_id);
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    },
  });
}

export function useProductList() {
  return useQuery({
    queryKey: ["product-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_data")
        .select("product_id, product_name")
        .order("product_id");
      if (error) throw error;
      const unique = new Map<string, string>();
      (data || []).forEach((r: any) => {
        if (!unique.has(r.product_id)) unique.set(r.product_id, r.product_name || r.product_id);
      });
      return Array.from(unique.entries()).map(([id, name]) => ({ id, name }));
    },
  });
}

// Aggregation utilities
export function aggregateByDate(data: SalesRecord[]) {
  const map = new Map<string, { sales: number; revenue: number }>();
  data.forEach((r) => {
    const existing = map.get(r.date) || { sales: 0, revenue: 0 };
    existing.sales += r.sales;
    existing.revenue += r.sales * r.price;
    map.set(r.date, existing);
  });
  return Array.from(map.entries())
    .map(([date, v]) => ({ date, sales: v.sales, revenue: +v.revenue.toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function aggregateByStore(data: SalesRecord[]) {
  const map = new Map<string, { storeName: string; region: string; sales: number; revenue: number }>();
  data.forEach((r) => {
    const existing = map.get(r.store_id) || {
      storeName: r.store_name || r.store_id,
      region: r.region || "N/A",
      sales: 0,
      revenue: 0,
    };
    existing.sales += r.sales;
    existing.revenue += r.sales * r.price;
    map.set(r.store_id, existing);
  });
  return Array.from(map.entries()).map(([id, v]) => ({
    storeId: id,
    ...v,
    revenue: +v.revenue.toFixed(2),
  }));
}

export function aggregateByCategory(data: SalesRecord[]) {
  const map = new Map<string, { sales: number; revenue: number }>();
  data.forEach((r) => {
    const cat = r.category || "Uncategorized";
    const existing = map.get(cat) || { sales: 0, revenue: 0 };
    existing.sales += r.sales;
    existing.revenue += r.sales * r.price;
    map.set(cat, existing);
  });
  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    ...v,
    revenue: +v.revenue.toFixed(2),
  }));
}

export function aggregateByMonth(data: SalesRecord[]) {
  const map = new Map<string, { sales: number; revenue: number }>();
  data.forEach((r) => {
    const key = r.date.substring(0, 7);
    const existing = map.get(key) || { sales: 0, revenue: 0 };
    existing.sales += r.sales;
    existing.revenue += r.sales * r.price;
    map.set(key, existing);
  });
  return Array.from(map.entries())
    .map(([month, v]) => ({ month, ...v, revenue: +v.revenue.toFixed(2) }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function generateForecastFromData(
  data: SalesRecord[],
  horizonDays: number
) {
  const daily = aggregateByDate(data);
  if (daily.length === 0) return [];

  const lastDate = new Date(daily[daily.length - 1].date);
  const recentValues = daily.slice(-60).map((d) => d.sales);
  const avg = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
  const trend = 0.002;

  let seed = 42;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  const forecast = [];
  for (let i = 1; i <= horizonDays; i++) {
    const date = new Date(lastDate);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay();
    const weekendEffect = dayOfWeek === 0 || dayOfWeek === 6 ? 1.2 : 1;
    const predicted = Math.round(avg * (1 + trend * i) * weekendEffect * (0.92 + rand() * 0.16));
    const uncertainty = predicted * (0.05 + i * 0.008);
    forecast.push({
      date: date.toISOString().split("T")[0],
      predicted,
      lower: Math.round(predicted - uncertainty),
      upper: Math.round(predicted + uncertainty),
    });
  }
  return forecast;
}
