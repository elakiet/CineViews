# 🎬 CineViews — Movie Rating Prediction Using User Demographics

A full-stack ML-powered movie rating prediction and recommendation system built on the **MovieLens 100K** dataset. Predicts how a user will rate any movie based on their demographic profile (age, gender, occupation) using a **Random Forest Regressor** combined with a **Collaborative Filtering** recommendation engine.

🌐 **Live Demo:** https://cine-views.vercel.app

---

## 📁 Project Structure

```
CineViews/
├── README.md
├── backend/
│   ├── app.py              ← Flask REST API (6 endpoints)
│   ├── train_model.py      ← Model training script
│   ├── requirements.txt    ← Python dependencies
│   └── data/               ← Place dataset files here
│       ├── u.data          ← 100,000 ratings
│       ├── u.user          ← 943 user demographics
│       └── u.item          ← 1,682 movie titles
└── frontend/
    └── src/
        ├── App.js
        ├── index.css
        ├── api.js              ← Axios instance with base URL
        └── components/
            ├── Navbar.js       ← Persistent navigation bar
            ├── Predictor.js    ← Movie rating prediction page
            ├── Recommender.jsx ← Personalised recommendation page
            └── Analytics.js    ← Analytics dashboard (4 charts)
```

---

## 🚀 Setup & Usage

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm

---

### Backend Setup

```bash
cd backend

# Install dependencies
pip3 install flask flask-cors scikit-learn pandas numpy

# Place the MovieLens 100K dataset files in backend/data/
# Download from: https://grouplens.org/datasets/movielens/100k/
# Required files: u.data, u.user, u.item

### 🧠 Main Modeling Script — `train_model.py`

This is the **core ML training script**. It:
- Loads the MovieLens 100K dataset (ratings + user demographics)
- Merges and encodes features (gender binary, occupation one-hot)
- Computes user average rating and movie average rating
- Trains a **Random Forest Regressor** (100 trees) on 80% of data
- Evaluates on 20% test set — MAE=0.396, RMSE=0.570, R²=0.744
- Saves the trained model bundle to `model.pkl`

> Run this **once** before starting the server. `app.py` loads the saved model — no retraining happens on the server.

```bash
# Step 1 — Run the main modeling script (only needed once)
python3 train_model.py
# Output: ✅ model.pkl saved successfully

# Step 2 — Start the Flask API server
python3 app.py
# API runs at http://127.0.0.1:5000
```

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the React development server
npm start
# App runs at http://localhost:3000
```

> ⚠️ Make sure both backend and frontend are running simultaneously.

---

## 📡 API Endpoints

| Method | Endpoint     | Description                               |
|--------|--------------|-------------------------------------------|
| GET    | /            | Health check — server status              |
| GET    | /options     | Returns all users and movies for dropdowns|
| POST   | /predict     | Predicts rating for a user + movie pair   |
| GET    | /recommend   | Top-N personalised movie recommendations  |
| GET    | /analytics   | Age/gender charts + rating distribution   |
| GET    | /metrics     | MAE, RMSE, R² model performance metrics   |

### Sample Input — `/predict`

**Request (POST):**
```json
{
  "user_id": 2,
  "movie_id": 9
}
```

**Response:**
```json
{
  "predicted_rating": 3.0,
  "movie_title": "Four Rooms (1995)",
  "user_id": 2,
  "movie_id": 9
}
```

---

### Sample Input — `/recommend`

**Request (GET):**
```
GET /recommend?user_id=6&top_n=5
```

**Response:**
```json
{
  "user_id": 6,
  "recommendations": [
    {
      "movie_id": 640,
      "title": "Apt Pupil (1998)",
      "predicted_rating": 4.85,
      "popularity": 160,
      "avg_rating": 4.11
    },
    {
      "movie_id": 271,
      "title": "Kolya (1996)",
      "predicted_rating": 4.66,
      "popularity": 98,
      "avg_rating": 4.05
    }
  ]
}
```

---

### Sample Input — `/metrics`

**Request (GET):**
```
GET /metrics
```

**Response:**
```json
{
  "mae": 0.396,
  "rmse": 0.570,
  "r2": 0.744
}
```

---

## 🤖 Recommendation Algorithm

The recommendation engine uses a **4-stage hybrid pipeline**:

1. **Neighbourhood Selection** — Cosine similarity computed over the full 943×1682 user-movie rating matrix. Top 20 most similar users identified.
2. **Candidate Generation** — Movies rated by those users that the target user has NOT seen yet. Capped at 300 for performance.
3. **Rating Prediction** — Random Forest model predicts the target user's rating for each candidate using their demographic profile.
4. **Re-ranking** — Sorted by predicted score (descending). Ties broken by popularity (number of global ratings).

---

## 🧠 Feature Engineering

Each (user, movie) pair is represented as a **24-dimensional feature vector**:

| Feature | Type | Description |
|---|---|---|
| Age | Integer | Raw age value |
| Gender | Binary | Male=0, Female=1 |
| Occupation | One-hot | 21 binary columns |
| User Avg Rating | Float | Historical mean rating of user |
| Movie Avg Rating | Float | Global mean rating of movie |

---

## 📊 Model Performance

Evaluated on the full MovieLens 100K dataset (100,000 ratings):

| Metric | Value | Meaning |
|--------|-------|---------|
| MAE    | 0.396 | Avg error < 0.4 stars |
| RMSE   | 0.570 | Penalises large errors |
| R²     | 0.744 | 74.4% variance explained |

---

## 🌐 Deployment

| Component | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://cine-views.vercel.app |
| Backend | Render.com | https://cineviews.onrender.com |
| Posters | TMDB API | https://themoviedb.org |

> ⚠️ **Browser Compatibility Note:** The live demo works best on **Google Chrome**. On other browsers (Safari, Brave, Firefox), the dropdown menus in the Predictor and Recommender pages may take longer to populate, and the Analytics dashboard may take additional time to load. This is due to the free-tier backend sleeping after inactivity and stricter CORS handling in non-Chrome browsers.
>
> **For best experience:** Open https://cineviews.onrender.com first and wait for it to respond before using the app. This wakes up the backend server.

---

## ✨ Features

- 🎯 **Movie Rating Predictor** — Predict how any user will rate any movie using demographics
- 🤖 **Recommendation Engine** — Personalised top-N movie recommendations with TMDB posters
- 📊 **Analytics Dashboard** — 4 live charts: age group, gender, rating distribution, top 10 movies
- ⭐ **Star Rating Display** — Animated star display with progress bar
- 🧭 **Persistent Navbar** — 3-page navigation (Predictor, Recommender, Analytics)
- 🎨 **Cinema-themed UI** — Dark theme with cinematic background

---

## 📦 Dataset

**MovieLens 100K** — GroupLens Research, University of Minnesota

- 100,000 ratings from 943 users across 1,682 movies
- Rating scale: 1 to 5
- Download: https://grouplens.org/datasets/movielens/100k/

| File | Description |
|---|---|
| u.data | user_id, movie_id, rating, timestamp |
| u.user | user_id, age, gender, occupation, zip |
| u.item | movie_id, title, release_date, genres |

---

## 🔧 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Chart.js, Axios |
| Backend | Python, Flask, Flask-CORS |
| ML Model | scikit-learn (RandomForestRegressor) |
| Data | pandas, numpy |
| Deployment | Vercel (frontend), Render.com (backend) |
| Movie Posters | TMDB API |