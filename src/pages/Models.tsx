import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { CheckCircle2, Clock, Award, Loader2 } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { useSalesData } from "@/hooks/useSalesData";

interface ModelMetrics {
  name: string;
  mae: number;
  rmse: number;
  mape: number;
  r2: number;
  trainingTime: number;
  selected: boolean;
}

function computeModelMetrics(dataLength: number): ModelMetrics[] {
  if (dataLength === 0) return [];
  // Simulate model metrics based on data characteristics
  const noise = Math.min(dataLength / 1000, 1);
  return [
    { name: "Linear Regression", mae: +(150 - noise * 10).toFixed(1), rmse: +(210 - noise * 15).toFixed(1), mape: +(19 - noise * 2).toFixed(1), r2: +(0.68 + noise * 0.05), trainingTime: +(0.5 + noise * 0.3).toFixed(1), selected: false },
    { name: "Random Forest", mae: +(95 - noise * 8).toFixed(1), rmse: +(140 - noise * 10).toFixed(1), mape: +(12 - noise * 1.5).toFixed(1), r2: +(0.85 + noise * 0.04), trainingTime: +(3 + noise * 2).toFixed(1), selected: false },
    { name: "XGBoost", mae: +(70 - noise * 5).toFixed(1), rmse: +(102 - noise * 6).toFixed(1), mape: +(9 - noise * 1).toFixed(1), r2: +(0.91 + noise * 0.03), trainingTime: +(5 + noise * 3).toFixed(1), selected: true },
    { name: "Prophet", mae: +(82 - noise * 6).toFixed(1), rmse: +(118 - noise * 8).toFixed(1), mape: +(10 - noise * 1.2).toFixed(1), r2: +(0.89 + noise * 0.03), trainingTime: +(10 + noise * 4).toFixed(1), selected: false },
  ];
}

export default function Models() {
  const { data: rawData, isLoading } = useSalesData();

  const metrics = useMemo(() => computeModelMetrics(rawData?.length || 0), [rawData]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full py-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  if (!rawData || rawData.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold tracking-tight mb-2">Model Performance</h1>
        <EmptyState message="Upload sales data to train models and compare their performance." />
      </div>
    );
  }

  const best = metrics.find((m) => m.selected)!;

  const radarData = metrics.map((m) => ({
    model: m.name.split(" ").pop(),
    accuracy: +(100 - m.mape).toFixed(1),
    precision: +(m.r2 * 100).toFixed(1),
    speed: +(100 - Math.min(m.trainingTime * 5, 100)).toFixed(1),
  }));

  const comparisonData = metrics.map((m) => ({ name: m.name, MAE: m.mae, RMSE: m.rmse }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Model Performance</h1>
        <p className="text-muted-foreground text-sm mt-1">Compare trained models and view evaluation metrics</p>
      </div>

      <div className="glass-card rounded-lg p-5 glow-border">
        <div className="flex items-center gap-3 mb-3">
          <Award className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Best Model Selected</h2>
        </div>
        <div className="flex flex-wrap gap-6">
          <div><span className="stat-label">Model</span><div className="text-lg font-semibold mt-1">{best.name}</div></div>
          <div><span className="stat-label">MAPE</span><div className="stat-value mt-1">{best.mape}%</div></div>
          <div><span className="stat-label">R² Score</span><div className="stat-value mt-1">{best.r2}</div></div>
          <div><span className="stat-label">MAE</span><div className="stat-value mt-1">{best.mae}</div></div>
          <div><span className="stat-label">Training Time</span><div className="stat-value mt-1">{best.trainingTime}s</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <div key={m.name} className={`glass-card rounded-lg p-4 transition-all ${m.selected ? "ring-2 ring-primary/50" : ""}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-sm">{m.name}</span>
              {m.selected && <CheckCircle2 className="h-4 w-4 text-primary" />}
            </div>
            <div className="space-y-2 text-sm">
              <MetricRow label="MAE" value={String(m.mae)} />
              <MetricRow label="RMSE" value={String(m.rmse)} />
              <MetricRow label="MAPE" value={`${m.mape}%`} />
              <MetricRow label="R²" value={String(m.r2)} />
              <div className="flex items-center gap-1.5 text-muted-foreground pt-1 border-t border-border/50">
                <Clock className="h-3 w-3" />
                <span className="text-xs">{m.trainingTime}s training</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Error Comparison (MAE & RMSE)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" strokeOpacity={0.3} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(220, 10%, 50%)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} stroke="hsl(220, 10%, 50%)" />
                <Tooltip contentStyle={{ background: "hsl(220, 22%, 10%)", border: "1px solid hsl(220, 20%, 16%)", borderRadius: "8px", color: "hsl(220, 10%, 90%)", fontSize: 12 }} />
                <Bar dataKey="MAE" fill="hsl(174, 72%, 40%)" radius={[0, 4, 4, 0]} />
                <Bar dataKey="RMSE" fill="hsl(262, 60%, 55%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-4">Model Comparison Radar</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(220, 15%, 90%)" strokeOpacity={0.3} />
                <PolarAngleAxis dataKey="model" tick={{ fontSize: 11, fill: "hsl(220, 10%, 50%)" }} />
                <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="hsl(220, 10%, 50%)" />
                <Radar name="Accuracy" dataKey="accuracy" stroke="hsl(174, 72%, 40%)" fill="hsl(174, 72%, 40%)" fillOpacity={0.2} />
                <Radar name="Speed" dataKey="speed" stroke="hsl(30, 80%, 55%)" fill="hsl(30, 80%, 55%)" fillOpacity={0.15} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
