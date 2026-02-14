import { Upload, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

export default function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mb-6">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h2 className="text-lg font-semibold mb-2">No data available</h2>
      <p className="text-muted-foreground text-sm max-w-md mb-6">
        {message || "Please upload sales data to generate forecasts and view analytics."}
      </p>
      <Link
        to="/upload"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
      >
        <Upload className="h-4 w-4" />
        Upload Sales Data
      </Link>
    </div>
  );
}
