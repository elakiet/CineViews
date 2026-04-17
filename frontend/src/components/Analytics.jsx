import React, { useEffect, useState } from "react";
import api from "../api";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale, LinearScale,
  BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend
);


/* ─── shared chart defaults ─────────────────────────────────────── */
const baseOpts = (xLabel, yLabel) => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: "#8892a4", font: { size: 12 } } },
    tooltip: { backgroundColor: "#10141e", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 },
  },
  scales: {
    x: {
      title: { display: !!xLabel, text: xLabel, color: "#8892a4", font: { size: 12 } },
      ticks: { color: "#8892a4" },
      grid:  { color: "rgba(255,255,255,0.05)" },
    },
    y: {
      title: { display: !!yLabel, text: yLabel, color: "#8892a4", font: { size: 12 } },
      ticks: { color: "#8892a4" },
      grid:  { color: "rgba(255,255,255,0.05)" },
    },
  },
});

/* ─── Metric card ────────────────────────────────────────────────── */
const MetricCard = ({ label, value, desc, accent = "#00e8b5" }) => (
  <div style={s.metricCard}>
    <p style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: "#8892a4", marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: "'Bebas Neue', cursive", fontSize: 38, color: accent, letterSpacing: 1 }}>{value}</p>
    {desc && <p style={{ fontSize: 11, color: "#8892a4", marginTop: 4 }}>{desc}</p>}
  </div>
);

/* ─── Chart card ─────────────────────────────────────────────────── */
const ChartCard = ({ title, height = 240, children }) => (
  <div style={s.chartCard}>
    <p style={s.chartTitle}>{title}</p>
    <div style={{ height }}>{children}</div>
  </div>
);


/* ═══ Main ══════════════════════════════════════════════════════════ */
export default function Analytics() {
  const [data,    setData]    = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    api.get("/analytics").then(r => setData(r.data));
    api.get("/metrics").then(r  => setMetrics(r.data));
  }, []);

  if (!data || !metrics) {
    return (
      <div className="page" style={{ alignItems: "center" }}>
        <div style={{ textAlign: "center", position: "relative", zIndex: 1 }}>
          <div className="spinner" />
          <p style={{ color: "#8892a4", marginTop: 12 }}>Loading analytics…</p>
        </div>
      </div>
    );
  }

  /* ── chart datasets ── */
  const ageChart = {
    labels: data.age_groups,
    datasets: [{
      label: "Avg Rating",
      data: data.age_ratings,
      backgroundColor: "rgba(0,232,181,0.65)",
      borderColor: "#00e8b5",
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const genderChart = {
    labels: data.gender_labels,
    datasets: [{
      data: data.gender_ratings,
      backgroundColor: ["rgba(0,232,181,0.75)", "rgba(255,122,61,0.75)"],
      borderColor:     ["#00e8b5", "#ff7a3d"],
      borderWidth: 2,
    }],
  };

  const topMoviesChart = {
    labels: data.top_movie_titles.map(t => t.length > 22 ? t.slice(0,22)+"…" : t),
    datasets: [{
      label: "# Ratings",
      data: data.top_movie_counts,
      backgroundColor: "rgba(255,122,61,0.65)",
      borderColor: "#ff7a3d",
      borderWidth: 2,
      borderRadius: 6,
    }],
  };

  const distChart = {
    labels: data.dist_labels.map(String),
    datasets: [{
      label: "Count",
      data: data.dist_counts,
      fill: true,
      backgroundColor: "rgba(0,232,181,0.12)",
      borderColor: "#00e8b5",
      borderWidth: 2,
      pointBackgroundColor: "#00e8b5",
      tension: 0.4,
    }],
  };

  return (
    <div className="page" style={{ alignItems: "flex-start" }}>
      <div style={s.wrapper} className="fade-up">

        <h1 style={s.heading}>📊 Analytics Dashboard</h1>
        <p style={{ ...s.sub, color: "#a0aec0" }}>Model performance & user behaviour insights from the MovieLens dataset</p>

        {/* ── Metrics row ── */}
        <div style={s.metricsRow}>
          <MetricCard label="MAE"    value={metrics.mae}  desc="Mean Absolute Error" />
          <MetricCard label="RMSE"   value={metrics.rmse} desc="Root Mean Squared Error" accent="#ffd166" />
          <MetricCard label="R² Score" value={metrics.r2} desc="Variance explained"    accent="#ff7a3d" />
          <MetricCard label="Total Ratings" value={(data.dist_counts.reduce((a,b)=>a+b,0)).toLocaleString()} desc="in dataset" accent="#a78bfa" />
        </div>

        {/* ── Charts grid ── */}
        <div style={s.grid}>
            
          <div style={{ gridColumn: "1 / -1" }}>
            <ChartCard title="Top 10 Most Rated Movies" height={280}>
              <Bar
                data={topMoviesChart}
                options={{
                  ...baseOpts("", "# Ratings"),
                  indexAxis: "y",
                  plugins: { legend: { display: false } },
                }}
              />
            </ChartCard>
           </div>

          <ChartCard title="Rating by Gender" height={260}>
            <Doughnut data={genderChart} options={{
              ...baseOpts(),
              cutout: "65%",
              plugins: {
                legend: { position: "bottom", labels: { color: "#8892a4" } },
              },
            }} />
          </ChartCard>

          <ChartCard title="Rating Distribution" height={260}>
            <Line data={distChart} options={baseOpts("Star Rating", "Count")} />
          </ChartCard>

          <ChartCard title="Top 10 Most Rated Movies" height={280}>
            <Bar
              data={topMoviesChart}
              options={{
                ...baseOpts("", "# Ratings"),
                indexAxis: "y",
                plugins: { legend: { display: false } },
              }}
            />
          </ChartCard>
        </div>

        {/* ── Model info ── */}
        <div style={s.modelInfo}>
          <p style={s.modelTitle}>Model Details</p>
          <div style={s.modelGrid}>
            {[
              ["Algorithm",   "Random Forest Regressor"],
              ["Estimators",  "100 trees"],
              ["Features",    "Age, Gender, Occupation, User avg, Movie avg"],
              ["Dataset",     "MovieLens 100K — 100,000 ratings, 943 users, 1,682 movies"],
            ].map(([k,v]) => (
              <div key={k} style={s.modelRow}>
                <span style={{ color: "#a0aec0", fontSize: 13 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#f0f2f8" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const s = {
  wrapper:    { width: "100%", maxWidth: 1200, position: "relative", zIndex: 1 },
  heading:    { fontFamily: "'Bebas Neue', cursive", fontSize: 34, letterSpacing: 2, marginBottom: 6 },
  sub:        { fontSize: 13, color: "#8892a4", marginBottom: 28 },

  metricsRow: { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" },
  metricCard: {
    flex: "1 1 140px",
    padding: "18px 20px",
    borderRadius: 16,
    background: "rgba(16, 20, 32, 0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },

  grid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
  gap: 20,
  marginBottom: 24,
},
  chartCard: {
    padding: "22px",
    borderRadius: 18,
    background: "rgba(16, 20, 32, 0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  },
  chartTitle: { fontSize: 13, fontWeight: 600, color: "#c8d0e0", marginBottom: 16, letterSpacing: 0.3 },

  modelInfo: {
    padding: "22px",
    borderRadius: 18,
    background: "rgba(16, 20, 32, 0.82)",
    border: "1px solid rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
    marginBottom: 20,
  },
  modelTitle: { fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#8892a4", marginBottom: 14 },
  modelGrid:  { display: "flex", flexDirection: "column", gap: 10 },
  modelRow: { display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 4, fontSize: 13, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.1)" },
};