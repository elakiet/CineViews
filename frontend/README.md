# 🎬 CineAI — Movie Rating Predictor & Recommender

A full-stack ML-powered movie rating prediction and recommendation system built on the **MovieLens 100K** dataset.

---

## Project Structure

```
MoviePredictor/
├── backend/
│   ├── app.py           ← Flask REST API (6 endpoints)
│   ├── train_model.py   ← Model training script
│   └── data/            ← Place u.data, u.user, u.item here
├── frontend/
│   └── src/
│       ├── App.js
│       ├── index.css
│       └── components/
│           ├── Navbar.js
│           ├── Predictor.js    ← Rating prediction page
│           ├── Recommender.js  ← NEW: personalised recommendations
│           └── Analytics.js    ← Enhanced analytics dashboard
```

---

## Setup

### Backend

```bash
cd backend
pip install flask flask-cors scikit-learn pandas numpy

# Place dataset files in backend/data/
#   u.data   (ratings)
#   u.user   (user demographics)
#   u.item   (movie titles)

python train_model.py    # generates model.pkl
python app.py            # starts API on http://127.0.0.1:5000
```

### Frontend

```bash
cd frontend
npm install
npm start                # runs on http://localhost:3000
```

---

## API Endpoints

| Method | Endpoint      | Description                          |
|--------|---------------|--------------------------------------|
| GET    | /             | Health check                         |
| GET    | /options      | Lists all users and movies           |
| POST   | /predict      | Predicts rating for user+movie pair  |
| GET    | /recommend    | Top-N personalised recommendations   |
| GET    | /analytics    | Age/gender breakdown + charts data   |
| GET    | /metrics      | MAE, RMSE, R² model metrics          |

### `/recommend` params
- `user_id` (int) — the user to generate recommendations for  
- `top_n` (int, default 10) — number of results to return

---

## Recommendation Algorithm

1. **Cosine Similarity** computed over the full user-movie rating matrix  
2. Top 20 most similar users identified  
3. Candidate movies = movies those users rated, minus movies the target user has already rated  
4. **Random Forest model** predicts the target user's rating for each candidate  
5. Results ranked by predicted score, then by popularity (number of ratings)

---

## Model Performance (on full dataset)

| Metric | Value |
|--------|-------|
| MAE    | ~0.40 |
| RMSE   | ~0.57 |
| R²     | ~0.74 |

---

## Features

- 🎯 **Predict** how any user will rate any movie
- 🎬 **TMDB poster** images fetched automatically
- ⭐ **Star rating** display with animated progress bar
- 🤖 **Collaborative filtering** recommendation engine
- 📊 **4-chart analytics dashboard** (age groups, gender, rating distribution, top movies)
- 🧭 **Persistent navbar** for easy navigation
- 🎨 **Dark cinema-themed UI** with smooth animations