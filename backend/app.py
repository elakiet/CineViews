from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization,Accept")
    response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
    return response

# ─── Load model bundle ────────────────────────────────────────────────────────
print("Loading model...")
data = pickle.load(open("model.pkl", "rb"))
model        = data["model"]
feature_cols = data["feature_cols"]
user_avg     = data["user_avg"]
movie_avg    = data["movie_avg"]
users        = data["users"]

# ─── Load raw data ────────────────────────────────────────────────────────────
print("Loading datasets...")
ratings = pd.read_csv(
    "data/u.data", sep="\t",
    names=["user_id", "movie_id", "rating", "timestamp"]
)
movies_df = pd.read_csv(
    "data/u.item", sep="|", encoding="latin-1",
    header=None, usecols=[0, 1], names=["movie_id", "title"]
)

# ─── Build similarity matrix ──────────────────────────────────────────────────
print("Building similarity matrix...")
user_movie_matrix = ratings.pivot_table(
    index="user_id", columns="movie_id", values="rating"
).fillna(0)
user_similarity = cosine_similarity(user_movie_matrix)
user_similarity_df = pd.DataFrame(
    user_similarity,
    index=user_movie_matrix.index,
    columns=user_movie_matrix.index
)

# ─── PRE-COMPUTE everything at startup ───────────────────────────────────────
print("Pre-computing analytics cache...")

def compute_analytics():
    df = pd.merge(ratings, users, on="user_id")
    df["age_group"] = pd.cut(
        df["age"], bins=[0,18,25,35,50,100],
        labels=["<18","18-25","26-35","36-50","50+"]
    )
    age_avg    = df.groupby("age_group", observed=True)["rating"].mean().reset_index()
    gender_avg = df.groupby("gender")["rating"].mean().reset_index()
    gender_avg["gender"] = gender_avg["gender"].map({"M":"Male","F":"Female"})
    top_movies = (
        ratings.groupby("movie_id")["rating"]
        .agg(count="count", avg="mean").reset_index()
        .merge(movies_df, on="movie_id")
        .nlargest(10,"count")[["title","count","avg"]]
    )
    rating_dist = ratings["rating"].value_counts().sort_index()
    return {
        "age_groups":       age_avg["age_group"].astype(str).tolist(),
        "age_ratings":      age_avg["rating"].round(2).tolist(),
        "gender_labels":    gender_avg["gender"].tolist(),
        "gender_ratings":   gender_avg["rating"].round(2).tolist(),
        "top_movie_titles": top_movies["title"].tolist(),
        "top_movie_counts": top_movies["count"].tolist(),
        "top_movie_avgs":   top_movies["avg"].round(2).tolist(),
        "dist_labels":      rating_dist.index.tolist(),
        "dist_counts":      rating_dist.values.tolist(),
    }

def compute_metrics():
    df = pd.merge(ratings, users, on="user_id")
    df["gender"] = df["gender"].map({"M":0,"F":1})
    df = pd.get_dummies(df, columns=["occupation"])
    ua = ratings.groupby("user_id")["rating"].mean()
    ma = ratings.groupby("movie_id")["rating"].mean()
    df["user_avg_rating"]  = df["user_id"].map(ua)
    df["movie_avg_rating"] = df["movie_id"].map(ma)
    for col in feature_cols:
        if col not in df.columns:
            df[col] = 0
    X     = df[feature_cols]
    y     = df["rating"]
    preds = model.predict(X)
    return {
        "mae":  round(float(mean_absolute_error(y, preds)), 3),
        "rmse": round(float(np.sqrt(mean_squared_error(y, preds))), 3),
        "r2":   round(float(r2_score(y, preds)), 3),
    }

# ── Cache at startup ──────────────────────────────────────────────────────────
ANALYTICS_CACHE = compute_analytics()
METRICS_CACHE   = compute_metrics()
print("✅ All caches ready — server is fast!")

# ─── Helper ───────────────────────────────────────────────────────────────────
def build_feature_row(user_id, movie_id):
    user_info        = users[users["user_id"] == user_id].iloc[0]
    user_avg_rating  = user_avg.get(user_id, 3)
    movie_avg_rating = movie_avg.get(movie_id, 3)
    row = {
        "age":              user_info["age"],
        "gender":           0 if user_info["gender"] == "M" else 1,
        "user_avg_rating":  user_avg_rating,
        "movie_avg_rating": movie_avg_rating,
    }
    for col in feature_cols:
        if col.startswith("occupation_"):
            row[col] = 0
    occ_col = f"occupation_{user_info['occupation']}"
    if occ_col in row:
        row[occ_col] = 1
    return pd.DataFrame([row])

# ═══════════════════════════════════════════════════════════════════════════════
# ROUTES
# ═══════════════════════════════════════════════════════════════════════════════

@app.route("/")
def home():
    return jsonify({"status": "CineViews API running 🚀"})

@app.route("/options", methods=["GET"])
def get_options():
    users_list  = users[["user_id"]].to_dict(orient="records")
    movies_list = movies_df.to_dict(orient="records")
    return jsonify({"users": users_list, "movies": movies_list})

@app.route("/predict", methods=["POST"])
def predict():
    req      = request.json
    user_id  = int(req["user_id"])
    movie_id = int(req["movie_id"])
    if user_id not in users["user_id"].values:
        return jsonify({"error": "Invalid user_id"}), 400
    input_df   = build_feature_row(user_id, movie_id)
    prediction = model.predict(input_df)[0]
    prediction = round(float(min(max(prediction, 1), 5)), 2)
    movie_title = movies_df[movies_df["movie_id"] == movie_id]["title"].values
    movie_title = movie_title[0] if len(movie_title) else "Unknown"
    return jsonify({
        "predicted_rating": prediction,
        "movie_title":      movie_title,
        "user_id":          user_id,
        "movie_id":         movie_id,
    })

@app.route("/recommend", methods=["GET"])
def recommend():
    user_id = int(request.args.get("user_id", 1))
    top_n   = int(request.args.get("top_n", 10))
    if user_id not in user_movie_matrix.index:
        return jsonify({"error": "User not found"}), 400
    sim_scores   = user_similarity_df[user_id].drop(user_id)
    top_users    = sim_scores.nlargest(20).index.tolist()
    rated_by_user = set(ratings[ratings["user_id"] == user_id]["movie_id"])
    candidate_ids = (
        set(ratings[ratings["user_id"].isin(top_users)]["movie_id"]) - rated_by_user
    )
    if not candidate_ids:
        candidate_ids = set(movie_avg.nlargest(200).index) - rated_by_user
    predictions = []
    for mid in list(candidate_ids)[:300]:
        try:
            feat  = build_feature_row(user_id, int(mid))
            score = float(model.predict(feat)[0])
            score = round(min(max(score, 1), 5), 2)
            title_row  = movies_df[movies_df["movie_id"] == mid]["title"].values
            title      = title_row[0] if len(title_row) else "Unknown"
            popularity = int(ratings[ratings["movie_id"] == mid].shape[0])
            predictions.append({
                "movie_id":         int(mid),
                "title":            title,
                "predicted_rating": score,
                "popularity":       popularity,
                "avg_rating":       round(float(movie_avg.get(mid, 3)), 2),
            })
        except Exception:
            continue
    predictions.sort(key=lambda x: (-x["predicted_rating"], -x["popularity"]))
    return jsonify({"user_id": user_id, "recommendations": predictions[:top_n]})

# ── Instant cached routes ──────────────────────────────────────────────────────
@app.route("/analytics", methods=["GET"])
def analytics():
    return jsonify(ANALYTICS_CACHE)

@app.route("/metrics", methods=["GET"])
def get_metrics():
    return jsonify(METRICS_CACHE)

if __name__ == "__main__":
    app.run(debug=True)