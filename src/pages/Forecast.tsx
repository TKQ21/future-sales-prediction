import { useMemo, useState } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { Calendar, Store, Package, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import {
  useSalesData, useStoreList, useProductList,
  aggregateByDate, generateForecastFromData,
} from "@/hooks/useSalesData";

export default function Forecast() {
  const [storeFilter, setStoreFilter] = useState("all");
  const [productFilter, setProductFilter] = useState("all");
  const [horizon, setHorizon] = useState(30);

  const { data: rawData, isLoading } = useSalesData();
  const { data: stores } = useStoreList();
  const { data: products } = useProductList();

  const filteredData = useMemo(() => {
    if (!rawData) return [];
    let d = rawData;
    if (storeFilter !== "all") d = d.filter(r => r.store_id === storeFilter);
    if (productFilter !== "all") d = d.filter(r => r.product_id === productFilter);
    return d;
  }, [rawData, storeFilter, productFilter]);

  const dailyData = useMemo(() => aggregateByDate(filteredData), [filteredData]);
  const forecast = useMemo(() => generateForecastFromData(filteredData, horizon), [filteredData, horizon]);

  const chartData = useMemo(() => {
    const historical = dailyData.slice(-60).map(d => ({
      date: d.date, actual: d.sales,
      predicted: null as number | null, lower: null as number | null, upper: null as number | null,
    }));
    const forecastMapped = forecast.map(f => ({
      date: f.date, actual: null as number | null,
      predicted: f.predicted, lower: f.lower, upper: f.upper,
    }));
    return [...historical, ...forecastMapped];
  }, [dailyData, forecast]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!rawData || rawData.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Sales Forecast</h1>
        <EmptyState message="Upload sales data to generate forecasts and predictions." />
      </div>
    );
  }

  const totalPredicted = forecast.reduce((a, f) => a + f.predicted, 0);
  const avgPredicted = forecast.length > 0 ? Math.round(totalPredicted / forecast.length) : 0;
  const lastActual = dailyData[dailyData.length - 1]?.sales || 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Forecast</h1>
        <p className="text-muted-foreground text-sm mt-1">Predict future sales based on your uploaded data</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <FilterSelect icon={Store} value={storeFilter} onChange={setStoreFilter}
          options={[{ value: "all", label: "All Stores" }, ...(stores || []).map(s => ({ value: s.id, label: s.name }))]} />
        <FilterSelect icon={Package} value={productFilter} onChange={setProductFilter}
          options={[{ value: "all", label: "All Products" }, ...(products || []).map(p => ({ value: p.id, label: p.name }))]} />
        <FilterSelect icon={Calendar} value={String(horizon)} onChange={(v) => setHorizon(Number(v))}
          options={[{ value: "7", label: "7 Days" }, { value: "30", label: "30 Days" }, { value: "90", label: "90 Days" }]} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-lg p-4">
          <span className="stat-label">Predicted Total ({horizon}d)</span>
          <div className="stat-value mt-2">{totalPredicted.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-lg p-4">
          <span className="stat-label">Avg Daily Forecast</span>
          <div className="stat-value mt-2">{avgPredicted.toLocaleString()}</div>
        </div>
        <div className="glass-card rounded-lg p-4">
          <span className="stat-label">Last Actual Day</span>
          <div className="stat-value mt-2">{lastActual.toLocaleString()}</div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Actual vs Forecast</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(200, 70%, 50%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(220, 10%, 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip contentStyle={{ background: "hsl(220, 22%, 10%)", border: "1px solid hsl(220, 20%, 16%)", borderRadius: "8px", color: "hsl(220, 10%, 90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" />
              <Area type="monotone" dataKey="lower" stroke="none" fill="transparent" />
              <Area type="monotone" dataKey="actual" stroke="hsl(200, 70%, 50%)" strokeWidth={2} fill="url(#actualGrad)" />
              <Area type="monotone" dataKey="predicted" stroke="hsl(174, 72%, 40%)" strokeWidth={2} strokeDasharray="6 3" fill="url(#predGrad)" />
              <ReferenceLine x={dailyData[dailyData.length - 1]?.date} stroke="hsl(220, 10%, 50%)" strokeDasharray="3 3"
                label={{ value: "Today", position: "top", fill: "hsl(220, 10%, 50%)", fontSize: 11 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-[hsl(200,70%,50%)] inline-block" /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-0.5 bg-primary inline-block" style={{ borderTop: "2px dashed" }} /> Predicted</span>
          <span className="flex items-center gap-1.5"><span className="w-4 h-2 bg-primary/10 inline-block rounded-sm" /> Confidence Interval</span>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Forecast Details</h2>
        <div className="overflow-x-auto max-h-64 overflow-y-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card">
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 stat-label">Date</th>
                <th className="text-right py-2 px-3 stat-label">Predicted</th>
                <th className="text-right py-2 px-3 stat-label">Lower Bound</th>
                <th className="text-right py-2 px-3 stat-label">Upper Bound</th>
              </tr>
            </thead>
            <tbody>
              {forecast.map((f) => (
                <tr key={f.date} className="border-b border-border/50">
                  <td className="py-2 px-3">{f.date}</td>
                  <td className="py-2 px-3 text-right font-mono">{f.predicted.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-muted-foreground">{f.lower.toLocaleString()}</td>
                  <td className="py-2 px-3 text-right font-mono text-muted-foreground">{f.upper.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ icon: Icon, value, onChange, options }: {
  icon: React.ComponentType<{ className?: string }>; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="glass-card rounded-md flex items-center gap-2 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm outline-none cursor-pointer text-foreground">
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-card text-foreground">{o.label}</option>
        ))}
      </select>
    </div>
  );
}
