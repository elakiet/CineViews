import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:5000";
const TMDB_KEY = "a065849509d791df96e46ffea588ad9c";

const fetchPoster = async (title) => {
  try {
    const clean = title.replace(/\s*\(\d{4}\)/, "").trim();
    const res   = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: TMDB_KEY, query: clean },
    });
    const hit = res.data.results[0];
    if (hit?.poster_path) return `https://image.tmdb.org/t/p/w300${hit.poster_path}`;
  } catch {}
  return null;
};

const Stars = ({ v }) => (
  <div style={{ display: "flex", gap: 2 }}>
    {[1,2,3,4,5].map(i => (
      <span key={i} style={{ fontSize: 13, color: i <= Math.round(v) ? "#ffd166" : "#2a2f3d" }}>★</span>
    ))}
  </div>
);

const MovieCard = ({ rec, rank }) => {
  const [poster, setPoster] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetchPoster(rec.title).then(url => { setPoster(url); setLoaded(true); });
  }, [rec.title]);

  const gradStop = rec.predicted_rating >= 4.0 ? "#00e8b5"
                 : rec.predicted_rating >= 3.0 ? "#ffd166"
                 : "#ff7a3d";

  return (
    <div style={{ ...styles.card, animationDelay: `${rank * 50}ms` }} className="fade-up">
      <div style={styles.posterWrap}>
        {loaded && poster
          ? <img src={poster} alt={rec.title} style={styles.poster} />
          : <div style={styles.posterFallback}>{loaded ? "🎬" : "⏳"}</div>
        }
        <div style={styles.rankBadge}>#{rank + 1}</div>
      </div>
      <div style={styles.info}>
        <p style={styles.title}>{rec.title}</p>
        <Stars v={rec.predicted_rating} />
        <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 8 }}>
          <span style={{ ...styles.predScore, color: gradStop }}>{rec.predicted_rating}</span>
          <span style={styles.predLabel}>predicted</span>
        </div>
        <div style={styles.metaRow}>
          <span style={styles.metaChip}>⭐ {rec.avg_rating} avg</span>
          <span style={styles.metaChip}>👥 {rec.popularity.toLocaleString()} ratings</span>
        </div>
      </div>
    </div>
  );
};

export default function Recommender() {
  const [users,   setUsers]   = useState([]);
  const [userId,  setUserId]  = useState("");
  const [topN,    setTopN]    = useState(10);
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [ran,     setRan]     = useState(false);

  useEffect(() => {
    axios.get(`${API}/options`).then(res => setUsers(res.data.users));
  }, []);

  const handleRecommend = useCallback(async () => {
    if (!userId) { setError("Please select a user."); return; }
    setError("");
    setLoading(true);
    setRecs([]);
    setRan(false);
    try {
      const res = await axios.get(`${API}/recommend`, { params: { user_id: userId, top_n: topN } });
      setRecs(res.data.recommendations);
      setRan(true);
    } catch {
      setError("Recommendation failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [userId, topN]);

  return (
    <div className="page" style={{ alignItems: "flex-start" }}>
      <div style={styles.wrapper}>

        <div className="card fade-up" style={styles.panel}>
          <h1 style={styles.heading}>🎯 Recommendations</h1>
          <p style={styles.sub}>Top picks personalised for any user</p>

          <label style={styles.label}>Select User</label>
          <select className="select" value={userId} onChange={e => setUserId(e.target.value)}>
            <option value="">— Choose a user —</option>
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>👤 User {u.user_id}</option>
            ))}
          </select>

          <label style={styles.label}>Number of Results</label>
          <select className="select" value={topN} onChange={e => setTopN(Number(e.target.value))}>
            {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n} movies</option>)}
          </select>

          {error && <p style={styles.error}>{error}</p>}

          <button className="btn-grad" onClick={handleRecommend} disabled={loading}>
            {loading ? "Finding matches…" : "✨ Get Recommendations"}
          </button>

          {ran && !loading && (
            <p style={styles.resultNote} className="fade-up">
              Found <strong>{recs.length}</strong> recommendations for User {userId}
            </p>
          )}
        </div>

        <div style={styles.grid}>
          {loading && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", paddingTop: 60 }}>
              <div className="spinner" />
              <p style={{ color: "#8892a4", marginTop: 12 }}>Crunching the numbers…</p>
            </div>
          )}

          {!loading && recs.map((rec, i) => (
            <MovieCard key={rec.movie_id} rec={rec} rank={i} />
          ))}

          {!loading && ran && recs.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#8892a4", paddingTop: 60 }}>
              No recommendations found. Try a different user.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const styles = {
  wrapper: { display: "flex", gap: 28, width: "100%", maxWidth: 1200, alignItems: "flex-start", position: "relative", zIndex: 1, justifyContent: "center" },
panel:   { width: 380, minWidth: 340, flexShrink: 0, position: "sticky", top: 80 },
  heading: { fontFamily: "'Bebas Neue', cursive", fontSize: 30, letterSpacing: 2, marginBottom: 6, color: "#ffffff" },
  sub:           { fontSize: 12, color: "#8892a4", marginBottom: 24, lineHeight: 1.6 },
  label:         { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "#8892a4", marginBottom: 6 },
  error:         { color: "#ff4d6d", fontSize: 13, marginBottom: 10 },
  resultNote:    { marginTop: 14, fontSize: 13, color: "#00e8b5", padding: "10px 14px", background: "rgba(0,232,181,0.08)", borderRadius: 10 },
  grid:          { flex: 1, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 18, alignContent: "start" },
  card:          { background: "rgba(16, 20, 32, 0.82)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default" },
  posterWrap:    { position: "relative", aspectRatio: "2/3", background: "#0a0c12", overflow: "hidden" },
  poster:        { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  posterFallback:{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, background: "#10141e" },
  rankBadge:     { position: "absolute", top: 8, left: 8, background: "rgba(10,12,18,0.85)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.1)" },
  info:          { padding: "12px 14px 14px" },
  title:         { fontSize: 13, fontWeight: 600, lineHeight: 1.35, marginBottom: 6, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" },
  predScore:     { fontFamily: "'Bebas Neue', cursive", fontSize: 28, letterSpacing: 1 },
  predLabel:     { fontSize: 11, color: "#8892a4" },
  metaRow:       { display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 },
  metaChip:      { fontSize: 10, padding: "3px 8px", borderRadius: 20, background: "rgba(255,255,255,0.05)", color: "#8892a4", border: "1px solid rgba(255,255,255,0.07)" },
};
