# 🛒 Smart Buy Compare

Smart Buy Compare is a **student-focused price comparison and decision-support web application** designed to help users choose the **best place and time to buy products** based on price, delivery speed, and upcoming deals.

Unlike basic comparison tools, this project focuses on **smart recommendations**, not just listing prices.

---

## 🎯 Project Objective

College students often face confusion while shopping online due to:
- different prices on different platforms
- trade-off between cheaper price vs faster delivery
- missing upcoming sales and deals

Smart Buy Compare solves this by:
- comparing multiple platforms
- ranking options based on user preference
- highlighting the **best option**
- showing upcoming deals so users can plan ahead

---

## ✨ Current Features (Implemented)

- 🔍 **Product Search**
  - Search student-use products (clothing, skincare, daily-use items)

- ⚖️ **Price Comparison**
  - Compare prices across multiple platforms (e.g., Amazon, Flipkart)

- 🚚 **Delivery-Based Ranking**
  - User can choose priority:
    - **Fast Delivery**
    - **Cheapest**
    - **Balanced (price + delivery)**

- ⭐ **Best Option Highlight**
  - Top-ranked offer is clearly marked as *Best Option*

- 🔔 **Upcoming Deals Information**
  - Displays future deals with:
    - deal name
    - expected price
    - platform
    - start date

- 🔗 **Trusted Redirects**
  - Clicking “Buy” redirects users to the official platform website

---

## 🧠 How the System Works

1. User enters a product name and selects a priority.
2. Frontend sends request to backend API.
3. Backend:
   - searches products from dataset
   - ranks offers based on user preference
4. Frontend:
   - displays ranked results
   - highlights the best option
   - shows upcoming deal information

---

## 🛠️ Tech Stack

### Frontend
- HTML
- CSS
- JavaScript (Vanilla)

### Backend
- Python
- Flask (REST API)

### Data
- Custom JSON dataset (student-focused products)

---



## 📁 Project Structure

## Smart-Buy-Compare
### Backend
- app.py

### Frontend
- index.html
- script.js
- style.css

### Data
- seed_products.json

### requirements.txt
### README.md
