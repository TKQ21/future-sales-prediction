📊 Retail Sales Forecasting Platform

🚀 Overview

This project is a production-style end-to-end Sales Forecasting System built to simulate how modern retail companies predict demand, optimize inventory, and plan revenue using machine learning.

The platform allows users to upload historical sales data, train multiple forecasting models, and generate future demand predictions with performance evaluation and visualization.

project link : https://ai-sales-forecasting.lovable.app

https://neon-pulse-retail.lovable.app

🎯 Business Problem

Retail businesses need accurate demand forecasting to:

Prevent stock-outs

Reduce excess inventory

Optimize supply chain planning

Improve revenue forecasting

Plan promotions effectively

This system converts raw historical sales data into actionable future demand predictions.

🏗️ System Architecture
Frontend

React

TailwindCSS

Recharts (Data Visualization)

Backend

Python

FastAPI

PostgreSQL

Machine Learning

Linear Regression

Random Forest

XGBoost (Best Model Selected)

Prophet (Time-Series Forecasting)

📂 Key Features
1️⃣ Data Upload

Upload CSV sales data

Data validation

Store in database

No hardcoded/mock data

2️⃣ Feature Engineering

Date parsing

Day of week extraction

Month feature

Lag features

Rolling averages

Promotion impact handling

3️⃣ Model Training & Comparison

Automatic training of multiple models

Evaluation using:

MAE

RMSE

MAPE

R² Score

Automatic best model selection

4️⃣ Forecasting

30-day forward forecast

Confidence intervals

Actual vs Forecast visualization

5️⃣ Dashboard

Total Revenue

Units Sold

Daily Sales Trend

Monthly Revenue

Store Performance

Model Performance Comparison

📊 Model Performance (Example Run)
Model	MAPE	R²
Linear Regression	17%	0.73
Random Forest	10.5%	0.89
XGBoost (Best)	8%	0.94
Prophet	8.8%	0.92

Best Model Selected: XGBoost

🔬 Why This Project is Real-World

No demo or hardcoded data

Dynamic database-driven dashboard

Multiple model benchmarking

Realistic synthetic dataset with seasonality

Proper train-test split

Confidence interval forecasting

Business-aligned evaluation metrics

📈 Business Impact

This system can help retail companies:

Improve forecast accuracy (8% MAPE achieved)

Reduce inventory holding cost

Improve demand planning

Support data-driven decision-making

🛠️ How to Run Locally
Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

Frontend
cd frontend
npm install
npm run dev


Upload dataset → Train models → Generate forecast.

💡 Future Improvements

Time-series cross validation

SHAP model explainability

Hyperparameter tuning

Per-product forecasting

Model retraining pipeline

Docker deployment

CI/CD integration
