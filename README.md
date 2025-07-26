# CupTrail

CupTrail is a mobile app built with React Native that helps users discover and review their favorite drinks - from matcha and boba to coffee and more. Users can search local shops, write reviews with photos, and track their favorite drinks - leaving a trail of cups wherever they go.

## Features

- **Discover Drinks from Nearby Cafés**
  - Browse highly-rated drinks and trending locations
  - Powered by Google Places for accurate, local search

- **Track Your Favorite Drinks**
  - Add personal reviews with ratings and comments
  - Each review is tied to a specific café location
  - Upload pictures of drinks to visually catalog your experience (WIP)

## Tech Stack

- **Frontend**: React Native (Expo), React Navigation
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: Google Places API, Place Details API

## Folder Structure
```
├── apis/ # Supabase and API logic (shops, reviews, drinks)
├── screens/ # App screens (Search, Storefront, InsertReview)
├── assets/ # Static assets (images, fonts, icons)
├── App.js # Entry point of the app
└── README.md # Project overview
```
## 🛠️ Setup Instructions

1. **Clone the repo**
```
git clone https://github.com/your-username/cup-trail.git
cd cup-trail
```
2. **Install dependencies**
```
npm install
```

3. **Set up environment variables**
Create a .env file in the root directory:

```
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
GOOGLE_API_KEY=your-google-places-api-key
```

4. **Run the app**
```
npx expo start
```
