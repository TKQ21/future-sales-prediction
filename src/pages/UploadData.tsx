import { useState, useCallback } from "react";
import { Upload, CheckCircle2, AlertCircle, Download, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const SAMPLE_CSV = `date,product_id,store_id,product_name,store_name,category,region,sales,price,discount,promotion
2024-01-01,P001,S001,Wireless Earbuds,Downtown Manhattan,Electronics,Northeast,45,79.99,0,0
2024-01-01,P002,S001,Running Shoes,Downtown Manhattan,Footwear,Northeast,23,129.99,10,1
2024-01-01,P003,S002,Organic Coffee,Chicago Loop,Grocery,Midwest,67,14.99,0,0
2024-01-02,P001,S001,Wireless Earbuds,Downtown Manhattan,Electronics,Northeast,52,79.99,0,0
2024-01-02,P004,S003,Yoga Mat,LA Beverly Hills,Sports,West,31,39.99,15,1`;

const REQUIRED_COLS = ["date", "product_id", "store_id", "sales", "price"];

export default function UploadData() {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<"idle" | "validating" | "uploading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState<string[][]>([]);
  const [uploadedCount, setUploadedCount] = useState(0);
  const queryClient = useQueryClient();

  const processFile = useCallback(async (f: File) => {
    setFile(f);
    setStatus("validating");
    setPreview([]);
    setMessage("");

    const text = await f.text();
    const lines = text.trim().split("\n");
    if (lines.length < 2) {
      setStatus("error");
      setMessage("File must contain at least a header row and one data row.");
      return;
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const missing = REQUIRED_COLS.filter((c) => !headers.includes(c));

    if (missing.length > 0) {
      setStatus("error");
      setMessage(`Missing required columns: ${missing.join(", ")}`);
      return;
    }

    const previewRows = lines.slice(0, 6).map((l) => l.split(",").map((c) => c.trim()));
    setPreview(previewRows);

    // Parse and insert into database
    setStatus("uploading");
    setMessage(`Uploading ${lines.length - 1} records...`);

    const dateIdx = headers.indexOf("date");
    const storeIdIdx = headers.indexOf("store_id");
    const storeNameIdx = headers.indexOf("store_name");
    const productIdIdx = headers.indexOf("product_id");
    const productNameIdx = headers.indexOf("product_name");
    const categoryIdx = headers.indexOf("category");
    const regionIdx = headers.indexOf("region");
    const salesIdx = headers.indexOf("sales");
    const priceIdx = headers.indexOf("price");
    const discountIdx = headers.indexOf("discount");
    const promotionIdx = headers.indexOf("promotion");
    const inventoryIdx = headers.indexOf("inventory");

    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.trim());
      if (cols.length < headers.length) continue;

      const dateVal = cols[dateIdx];
      const salesVal = parseInt(cols[salesIdx]);
      const priceVal = parseFloat(cols[priceIdx]);
      if (!dateVal || isNaN(salesVal) || isNaN(priceVal)) continue;

      const d = new Date(dateVal);
      rows.push({
        date: dateVal,
        store_id: cols[storeIdIdx],
        store_name: storeNameIdx >= 0 ? cols[storeNameIdx] || null : null,
        product_id: cols[productIdIdx],
        product_name: productNameIdx >= 0 ? cols[productNameIdx] || null : null,
        category: categoryIdx >= 0 ? cols[categoryIdx] || null : null,
        region: regionIdx >= 0 ? cols[regionIdx] || null : null,
        sales: salesVal,
        price: priceVal,
        discount: discountIdx >= 0 ? parseFloat(cols[discountIdx]) || 0 : 0,
        promotion: promotionIdx >= 0 ? cols[promotionIdx] === "1" || cols[promotionIdx].toLowerCase() === "true" : false,
        inventory: inventoryIdx >= 0 ? parseInt(cols[inventoryIdx]) || 0 : 0,
        day_of_week: d.getDay(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }

    if (rows.length === 0) {
      setStatus("error");
      setMessage("No valid data rows found in the file.");
      return;
    }

    // Insert in batches of 500
    const batchSize = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await (supabase as any).from("sales_data").insert(batch);
      if (error) {
        setStatus("error");
        setMessage(`Upload failed: ${error.message}`);
        return;
      }
      inserted += batch.length;
      setMessage(`Uploading... ${inserted}/${rows.length} records`);
    }

    setUploadedCount(inserted);
    setStatus("success");
    setMessage(`Successfully uploaded ${inserted} records to the database.`);
    queryClient.invalidateQueries({ queryKey: ["sales-data"] });
    queryClient.invalidateQueries({ queryKey: ["store-list"] });
    queryClient.invalidateQueries({ queryKey: ["product-list"] });
    toast.success(`${inserted} records uploaded successfully!`);
  }, [queryClient]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files[0];
      if (f && f.name.endsWith(".csv")) processFile(f);
      else { setStatus("error"); setMessage("Please upload a CSV file."); }
    },
    [processFile]
  );

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to delete all uploaded data?")) return;
    const { error } = await (supabase as any).from("sales_data").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) {
      toast.error("Failed to clear data: " + error.message);
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["sales-data"] });
    queryClient.invalidateQueries({ queryKey: ["store-list"] });
    queryClient.invalidateQueries({ queryKey: ["product-list"] });
    setStatus("idle");
    setFile(null);
    setPreview([]);
    setMessage("");
    toast.success("All data cleared successfully.");
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample_sales_data.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload Sales Data</h1>
        <p className="text-muted-foreground text-sm mt-1">Upload a CSV file with historical sales data to train forecasting models</p>
      </div>

      <div className="glass-card rounded-lg p-4">
        <h2 className="text-sm font-semibold mb-2">Required Columns</h2>
        <div className="flex flex-wrap gap-2">
          {REQUIRED_COLS.map((c) => (
            <span key={c} className="px-2.5 py-1 bg-accent text-accent-foreground rounded-md text-xs font-mono">{c}</span>
          ))}
          {["product_name", "store_name", "category", "region", "promotion", "discount"].map((c) => (
            <span key={c} className="px-2.5 py-1 bg-muted text-muted-foreground rounded-md text-xs font-mono">{c} (optional)</span>
          ))}
        </div>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass-card rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${dragOver ? "border-primary bg-accent/50" : "border-border"}`}
        onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".csv";
          input.onchange = (e) => {
            const f = (e.target as HTMLInputElement).files?.[0];
            if (f) processFile(f);
          };
          input.click();
        }}
      >
        <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Drop CSV file here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">Supports .csv files up to 50MB</p>
      </div>

      {status !== "idle" && (
        <div className={`glass-card rounded-lg p-4 flex items-start gap-3 ${status === "error" ? "border-destructive/50" : status === "success" ? "border-primary/50" : ""}`}>
          {(status === "validating" || status === "uploading") && <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0" />}
          {status === "success" && <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />}
          {status === "error" && <AlertCircle className="h-5 w-5 text-destructive shrink-0" />}
          <div>
            <p className="font-medium text-sm">{file?.name}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{message}</p>
          </div>
        </div>
      )}

      {preview.length > 0 && (status === "success" || status === "uploading") && (
        <div className="glass-card rounded-lg p-5">
          <h2 className="text-sm font-semibold mb-3">Data Preview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {preview[0].map((h, i) => (
                    <th key={i} className="text-left py-2 px-3 stat-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(1).map((row, i) => (
                  <tr key={i} className="border-b border-border/50">
                    {row.map((cell, j) => (
                      <td key={j} className="py-2 px-3 font-mono text-xs">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button onClick={handleDownloadSample} className="flex items-center gap-2 text-sm text-primary hover:underline">
          <Download className="h-4 w-4" />
          Download sample CSV dataset
        </button>
        <button onClick={handleClearData} className="flex items-center gap-2 text-sm text-destructive hover:underline ml-auto">
          <Trash2 className="h-4 w-4" />
          Clear all data
        </button>
      </div>
    </div>
  );
}
