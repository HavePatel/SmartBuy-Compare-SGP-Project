## 🛒 Smart Buy Compare


Smart Buy Compare is an intelligent price comparison and decision-support web application designed to help users choose when and where to buy products based on price, delivery speed, and upcoming deals.

Unlike traditional comparison tools, this platform focuses on smart recommendations, tracking, and personalized insights.

## 🎯 Project Objective

Online shopping often creates confusion due to:

- Different prices across platforms
- Trade-off between cheaper price vs faster delivery
- Missing out on upcoming deals
  
Smart Buy Compare solves this by:
- Comparing multiple platforms
- Ranking offers based on user preference
- Providing buy-now vs wait recommendations
- Tracking prices and notifying users
  
## ✨ Key Features
### 🔍 Smart Product Search
- Search across categories (clothing, skincare, daily use)
- Clean and fast UI
  
### 💸 Intelligent Price Comparison
- Compare offers across platforms
- Prioritize:
  * Cheapest
  * Fast Delivery
  * Balanced
  
### 🧠 Smart Recommendation Engine
- Suggests:
  * Buy Now 🛒
  * Wait for Deal 🕒
- Based on price trends and upcoming deals

### 📊 Price Tracking & History
- Track product prices over time
- Visual price graphs
- Detect price drops

### 🔔 Alerts & Notifications
- Get notified when:
  * Price drops
  * Deals become available
- Priority-based alerts

### 👤 User Authentication
- Google OAuth login
- Session-based authentication
- Secure user management

### 📂 Personalized Dashboard
- View:
  * Saved products
  * Active trackers
  * Price alerts
- Manage tracking and saved items

### 💾 Save & Track Products
- Bookmark products
- Start/stop tracking
- Personalized experience

### 🎨 Modern UI/UX
- Clean responsive design
- Smooth interactions
- Highlighted best options
- (Upcoming: Dark mode, animations, skeleton loading)

## ⚙️ How the System Works
1. User searches a product
2. Frontend sends request to backend
3. Backend:
  * Fetches products (DB / API / simulated updates)
  * Ranks offers based on priority
4. System:
  * Suggests best option
  * Provides tracking + alerts
5. Frontend displays results dynamically

## 🏗️ Tech Stack

### 🖥️ Frontend
- HTML
- CSS
- JavaScript (Vanilla)

### ⚙️ Backend
- Python
- Flask (REST API)
- Modular Architecture (routes, services, models)

### 🗄️ Database
- PostgreSQL (main)
- SQLite (development)

### 🔐 Authentication
- Google OAuth
- Session-based auth

### 📊 Data Handling
- Simulated real-time updates
- Price tracking engine
- (Upcoming: External API + scraping layer)
  
## 📁 Project Structure

```
Smart-Buy-Compare/
│
├── backend/
│   ├── app.py               
│   ├── config.py            
│   ├── extensions.py
│   ├── models.py
│   ├── price_engine.py     
│   │
│   ├── routes/
│   │   ├── auth.py
│   │   ├── user.py
│   │   └── products.py
│   │
│   ├── services/
│   │   ├── product_service.py
│   │   ├── scraper_service.py
│   │   └── recommendation_service.py
│   │
│   └── __init__.py
│
├── frontend/
│   ├── index.html
│   ├── dashboard.html
│   ├── product.html
│   ├── script.js
│   ├── dashboard.js
│   ├── product.js
│   └── style.css
│
├── database/
│   ├── seed_data.py
│   └── (migrations/)
│
├── data/
│   └── seed_products.json
│
├── smartbuy.db
├── requirements.txt
├── .env
├── .gitignore
└── README.md
```
