"""
train_model.py  —  CineAI Movie Rating Predictor
Trains a RandomForestRegressor on the MovieLens 100K dataset and
serialises everything needed by the Flask API into model.pkl.
"""

import pickle
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

# ─── Load datasets ────────────────────────────────────────────────────────────
print("📂  Loading datasets…")

ratings = pd.read_csv(
    "data/u.data",
    sep="\t",
    names=["user_id", "movie_id", "rating", "timestamp"],
)

users = pd.read_csv(
    "data/u.user",
    sep="|",
    names=["user_id", "age", "gender", "occupation", "zip"],
)

# ─── Feature engineering ─────────────────────────────────────────────────────
print("🔧  Engineering features…")

data = pd.merge(ratings, users, on="user_id")

data["gender"] = data["gender"].map({"M": 0, "F": 1})
data = pd.get_dummies(data, columns=["occupation"])

user_avg  = ratings.groupby("user_id")["rating"].mean()
movie_avg = ratings.groupby("movie_id")["rating"].mean()

data["user_avg_rating"]  = data["user_id"].map(user_avg)
data["movie_avg_rating"] = data["movie_id"].map(movie_avg)

feature_cols = (
    ["age", "gender", "user_avg_rating", "movie_avg_rating"]
    + [c for c in data.columns if c.startswith("occupation_")]
)

X = data[feature_cols]
y = data["rating"]

# ─── Train / test split ───────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

# ─── Model training ───────────────────────────────────────────────────────────
print("🚀  Training RandomForestRegressor (100 estimators)…")
model = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
model.fit(X_train, y_train)

# ─── Evaluation ───────────────────────────────────────────────────────────────
preds = model.predict(X_test)
mae   = mean_absolute_error(y_test, preds)
rmse  = np.sqrt(mean_squared_error(y_test, preds))
r2    = r2_score(y_test, preds)

print(f"\n📊  Test-set metrics:")
print(f"    MAE  : {mae:.4f}")
print(f"    RMSE : {rmse:.4f}")
print(f"    R²   : {r2:.4f}")

# ─── Feature importance report ────────────────────────────────────────────────
importance = pd.Series(model.feature_importances_, index=feature_cols)
top5 = importance.nlargest(5)
print("\n🌟  Top-5 most important features:")
for feat, val in top5.items():
    print(f"    {feat:<35} {val:.4f}")

# ─── Persist model bundle ─────────────────────────────────────────────────────
bundle = {
    "model":        model,
    "feature_cols": feature_cols,
    "user_avg":     user_avg,
    "movie_avg":    movie_avg,
    "users":        users,
}
pickle.dump(bundle, open("model.pkl", "wb"))
print("\n✅  model.pkl saved successfully.")