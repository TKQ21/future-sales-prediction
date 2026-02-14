
-- Sales data table for user-uploaded CSV data
CREATE TABLE public.sales_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  store_id TEXT NOT NULL,
  store_name TEXT,
  product_id TEXT NOT NULL,
  product_name TEXT,
  category TEXT,
  region TEXT,
  sales INTEGER NOT NULL DEFAULT 0,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(5,2) DEFAULT 0,
  holiday BOOLEAN DEFAULT false,
  promotion BOOLEAN DEFAULT false,
  inventory INTEGER DEFAULT 0,
  day_of_week INTEGER,
  month INTEGER,
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sales_data ENABLE ROW LEVEL SECURITY;

-- Allow public read/insert for now (no auth required yet)
CREATE POLICY "Allow public read" ON public.sales_data FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON public.sales_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON public.sales_data FOR DELETE USING (true);

-- Indexes for common queries
CREATE INDEX idx_sales_data_date ON public.sales_data(date);
CREATE INDEX idx_sales_data_store ON public.sales_data(store_id);
CREATE INDEX idx_sales_data_product ON public.sales_data(product_id);
CREATE INDEX idx_sales_data_category ON public.sales_data(category);
