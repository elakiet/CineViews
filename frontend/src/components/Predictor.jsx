import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = "https://CineViews.onrender.com";
const TMDB_KEY = "a065849509d791df96e46ffea588ad9c";

/* ── helpers ────────────────────────────────────────────────────────── */
const StarRating = ({ value }) => {
  const full = Math.floor(value);
  const half = value - full >= 0.4;
  return (
    <div style={{ display: "flex", gap: 4, margin: "10px 0" }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 26, color: i <= full ? "#ffd166" : i === full + 1 && half ? "#ffd166" : "#444a5a" }}>
          {i <= full ? "★" : i === full + 1 && half ? "★" : "★"}
        </span>
      ))}
    </div>
  );
};

const RatingBar = ({ value }) => {
  const pct  = ((value - 1) / 4) * 100;
  const hue  = pct * 1.2;
  return (
    <div style={{ background: "rgba(255,255,255,0.07)", borderRadius: 99, height: 8, overflow: "hidden", margin: "10px 0 18px" }}>
      <div style={{
        width: `${pct}%`, height: "100%",
        background: `hsl(${hue}, 80%, 55%)`,
        borderRadius: 99,
        transition: "width 0.6s cubic-bezier(0.34,1.56,0.64,1)",
        boxShadow: `0 0 8px hsl(${hue}, 80%, 55%)`,
      }} />
    </div>
  );
};

const getPoster = async (movieName) => {
  try {
    const clean = movieName.replace(/\s*\(\d{4}\)/, "").trim();
    const res   = await axios.get("https://api.themoviedb.org/3/search/movie", {
      params: { api_key: TMDB_KEY, query: clean },
    });
    if (res.data.results.length > 0) {
      const path = res.data.results[0].poster_path;
      if (path) return `https://image.tmdb.org/t/p/w500${path}`;
    }
  } catch { /* silent fail */ }
  return null;
};


/* ── Component ───────────────────────────────────────────────────────── */
export default function Predictor() {
  const navigate = useNavigate();

  const [users,   setUsers]   = useState([]);
  const [movies,  setMovies]  = useState([]);
  const [userId,  setUserId]  = useState("");
  const [movieId, setMovieId] = useState("");
  const [result,  setResult]  = useState(null);
  const [poster,  setPoster]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  useEffect(() => {
    axios.get(`${API}/options`).then(res => {
      setUsers(res.data.users);
      setMovies(res.data.movies);
    });
  }, []);

  const handlePredict = useCallback(async () => {
    if (!userId || !movieId) { setError("Please select both a user and a movie."); return; }
    setError("");
    setLoading(true);
    setResult(null);
    setPoster(null);

    try {
      const [predRes] = await Promise.all([
        axios.post(`${API}/predict`, { user_id: userId, movie_id: movieId }),
      ]);
      const data  = predRes.data;
      const img   = await getPoster(data.movie_title);
      setResult(data);
      setPoster(img);
    } catch (e) {
      setError("Prediction failed. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [userId, movieId]);

  return (
    <div className="page">
      <div className="card fade-up" style={{ width: "100%", maxWidth: 520 }}>

        {/* Title */}
        <h1 style={s.title}>🎬 Movie Predictor</h1>
        <p style={s.sub}>Predict how a user will rate any film based on demographics</p>

        {/* Selects */}
        <label style={s.label}>Select User</label>
        <select className="select" value={userId} onChange={e => setUserId(e.target.value)}>
          <option value="">— Choose a user —</option>
          {users.map(u => (
            <option key={u.user_id} value={u.user_id}>👤 User {u.user_id}</option>
          ))}
        </select>

        <label style={s.label}>Select Movie</label>
        <select className="select" value={movieId} onChange={e => setMovieId(e.target.value)}>
          <option value="">— Choose a movie —</option>
          {movies.map(m => (
            <option key={m.movie_id} value={m.movie_id}>{m.title}</option>
          ))}
        </select>

        {error && <p style={s.error}>{error}</p>}

        {/* Actions */}
        <button className="btn-grad" onClick={handlePredict} disabled={loading} style={{ marginBottom: 10 }}>
          {loading ? "Predicting…" : "✨ Predict Rating"}
        </button>
        <button className="btn-grad" onClick={() => navigate("/recommend")}
          style={{ background: "rgba(255,255,255,0.06)", color: "#fff", marginBottom: 10 }}>
          🎯 Get Recommendations
        </button>
        <button className="btn-grad" onClick={() => navigate("/dashboard")}
          style={{ background: "rgba(255,255,255,0.06)", color: "#fff" }}>
          📊 View Dashboard
        </button>

        {/* Loading */}
        {loading && <div className="spinner" />}

        {/* Result */}
        {result && !loading && (
          <div className="fade-up" style={s.resultBox}>
            {poster ? (
              <img src={poster} alt={result.movie_title} style={s.poster} />
            ) : (
              <div style={s.posterPlaceholder}>🎬</div>
            )}

            <div style={s.resultMeta}>
              <span className="badge">Predicted</span>
              <h3 style={s.movieTitle}>{result.movie_title}</h3>
              <StarRating value={result.predicted_rating} />
              <RatingBar  value={result.predicted_rating} />
              <div style={s.ratingNum}>{result.predicted_rating} <span style={s.ratingDenom}>/ 5</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  title: { fontFamily: "'Bebas Neue', cursive", fontSize: 32, letterSpacing: 2, marginBottom: 6, color: "#ffffff" },
  sub:    { fontSize: 13, color: "#8892a4", marginBottom: 24 },
  label:  { display: "block", fontSize: 11, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: "#8892a4", marginBottom: 6 },
  error:  { color: "#ff4d6d", fontSize: 13, marginBottom: 10 },
  resultBox: {
    marginTop: 28,
    padding: 22,
    borderRadius: 16,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: "flex", gap: 20, alignItems: "flex-start",
  },
  poster: {
    width: 110, minWidth: 110, borderRadius: 10,
    objectFit: "cover", background: "#000",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
  },
  posterPlaceholder: {
    width: 110, minWidth: 110, height: 160,
    borderRadius: 10, background: "rgba(255,255,255,0.06)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 40,
  },
  resultMeta:  { flex: 1 },
  movieTitle: { fontSize: 16, fontWeight: 600, margin: "8px 0", lineHeight: 1.3, color: "#ffffff" },
  ratingNum:   { fontFamily: "'Bebas Neue', cursive", fontSize: 40, color: "#00e8b5", letterSpacing: 1 },
  ratingDenom: { fontSize: 20, color: "#8892a4" },
};