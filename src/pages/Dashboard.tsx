import { useMemo } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { DollarSign, ShoppingCart, TrendingUp, Package, Loader2 } from "lucide-react";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import {
  useSalesData, aggregateByDate, aggregateByStore,
  aggregateByCategory, aggregateByMonth,
} from "@/hooks/useSalesData";

const CHART_COLORS = [
  "hsl(174, 72%, 40%)",
  "hsl(262, 60%, 55%)",
  "hsl(30, 80%, 55%)",
  "hsl(200, 70%, 50%)",
  "hsl(340, 65%, 55%)",
  "hsl(100, 50%, 45%)",
];

export default function Dashboard() {
  const { data: rawData, isLoading, error } = useSalesData();

  const dailyData = useMemo(() => rawData ? aggregateByDate(rawData) : [], [rawData]);
  const monthlyData = useMemo(() => rawData ? aggregateByMonth(rawData) : [], [rawData]);
  const storeData = useMemo(() => rawData ? aggregateByStore(rawData) : [], [rawData]);
  const categoryData = useMemo(() => rawData ? aggregateByCategory(rawData) : [], [rawData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="glass-card rounded-lg p-6 text-center text-destructive">
          Failed to load data. Please try again.
        </div>
      </div>
    );
  }

  if (!rawData || rawData.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Sales Dashboard</h1>
        <EmptyState />
      </div>
    );
  }

  const totalSales = rawData.reduce((a, r) => a + r.sales, 0);
  const totalRevenue = rawData.reduce((a, r) => a + r.sales * r.price, 0);
  const numDays = dailyData.length || 1;
  const avgDaily = Math.round(totalSales / numDays);

  const last30 = dailyData.slice(-30).reduce((a, d) => a + d.sales, 0);
  const prev30 = dailyData.slice(-60, -30).reduce((a, d) => a + d.sales, 0);
  const growthPct = prev30 > 0 ? ((last30 - prev30) / prev30 * 100).toFixed(1) : "N/A";

  const uniqueProducts = new Set(rawData.map(r => r.product_id)).size;
  const uniqueCategories = new Set(rawData.map(r => r.category).filter(Boolean)).size;

  const chartDaily = dailyData.slice(-90);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Sales Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Overview of retail performance across all stores
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={totalRevenue >= 1e6 ? `$${(totalRevenue / 1e6).toFixed(2)}M` : `$${(totalRevenue / 1e3).toFixed(1)}k`}
          change={growthPct !== "N/A" ? `${growthPct}% vs prev 30d` : ""}
          changeType={growthPct !== "N/A" && Number(growthPct) >= 0 ? "up" : "down"}
          icon={DollarSign}
        />
        <StatCard
          label="Total Units Sold"
          value={totalSales.toLocaleString()}
          change={`${numDays} days of data`}
          changeType="neutral"
          icon={ShoppingCart}
        />
        <StatCard
          label="Avg Daily Sales"
          value={avgDaily.toLocaleString()}
          change="Across all stores"
          changeType="neutral"
          icon={TrendingUp}
        />
        <StatCard
          label="Active Products"
          value={String(uniqueProducts)}
          change={`Across ${uniqueCategories} categories`}
          changeType="neutral"
          icon={Package}
        />
      </div>

      <div className="glass-card rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Daily Sales Trend (Last 90 Days)</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartDaily}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(174, 72%, 40%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" strokeOpacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(220, 10%, 50%)" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
              <Tooltip contentStyle={{ background: "hsl(220, 22%, 10%)", border: "1px solid hsl(220, 20%, 16%)", borderRadius: "8px", color: "hsl(220, 10%, 90%)", fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(174, 72%, 40%)" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Monthly Revenue</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" strokeOpacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} stroke="hsl(220, 10%, 50%)" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(220, 22%, 10%)", border: "1px solid hsl(220, 20%, 16%)", borderRadius: "8px", color: "hsl(220, 10%, 90%)", fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(174, 72%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Sales by Category</h2>
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="50%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="sales" nameKey="category" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(220, 22%, 10%)", border: "1px solid hsl(220, 20%, 16%)", borderRadius: "8px", color: "hsl(220, 10%, 90%)", fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 flex-1">
              {categoryData.map((c, i) => (
                <div key={c.category} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                  <span className="text-muted-foreground">{c.category}</span>
                  <span className="ml-auto font-mono text-xs">{c.sales.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-lg p-5">
        <h2 className="text-sm font-semibold mb-4">Store Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 stat-label">Store</th>
                <th className="text-left py-2 px-3 stat-label">Region</th>
                <th className="text-right py-2 px-3 stat-label">Units Sold</th>
                <th className="text-right py-2 px-3 stat-label">Revenue</th>
                <th className="text-right py-2 px-3 stat-label">Avg Price</th>
              </tr>
            </thead>
            <tbody>
              {storeData.map((s) => (
                <tr key={s.storeId} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-2.5 px-3 font-medium">{s.storeName}</td>
                  <td className="py-2.5 px-3 text-muted-foreground">{s.region}</td>
                  <td className="py-2.5 px-3 text-right font-mono">{s.sales.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-mono">${(s.revenue / 1000).toFixed(1)}k</td>
                  <td className="py-2.5 px-3 text-right font-mono">${(s.revenue / s.sales).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
