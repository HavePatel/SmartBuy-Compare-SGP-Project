from flask import Flask, jsonify, request
import json
import os



app = Flask(__name__)
from flask_cors import CORS
CORS(app)

# --------------------------------------------------
# Load product data from JSON file
# --------------------------------------------------

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "seed_products.json")

with open(DATA_FILE, "r") as file:
    product_data = json.load(file)

# --------------------------------------------------
# Helper function: Rank offers based on priority
# --------------------------------------------------

def rank_offers(offers, priority):
    if priority == "fast":
        # Faster delivery first
        return sorted(offers, key=lambda x: (x["delivery_days"], x["price"]))

    elif priority == "cheap":
        # Cheaper price first
        return sorted(offers, key=lambda x: (x["price"], x["delivery_days"]))

    elif priority == "balanced":
        # Balance price and delivery
        price_sorted = sorted(offers, key=lambda x: x["price"])
        delivery_sorted = sorted(offers, key=lambda x: x["delivery_days"])

        ranked = []
        for offer in offers:
            price_rank = price_sorted.index(offer)
            delivery_rank = delivery_sorted.index(offer)
            ranked.append((price_rank + delivery_rank, offer))

        ranked.sort(key=lambda x: x[0])
        return [item[1] for item in ranked]

    return offers

# --------------------------------------------------
# API: Get all products
# --------------------------------------------------

@app.route("/api/products", methods=["GET"])
def get_products():
    return jsonify(product_data)

# --------------------------------------------------
# API: Search products + APPLY ranking
# --------------------------------------------------

@app.route("/api/search", methods=["GET"])
def search_products():
    query = request.args.get("query", "").lower()
    priority = request.args.get("priority", "balanced").lower()

    if not query:
        return jsonify({"results": []})

    matched_products = []

    for category in product_data.get("categories", []):
        for product in category.get("products", []):
            product_name = product.get("name", "").lower()

            if query in product_name:
                offers = product.get("offers", [])

                # 🔥 APPLY RANKING HERE
                ranked_offers = rank_offers(offers, priority)

                matched_products.append({
                    "category": category.get("name"),
                    "product_id": product.get("id"),
                    "product_name": product.get("name"),
                    "brand": product.get("brand"),
                    "offers": ranked_offers,
                    "upcoming_deal": product.get("upcoming_deal")
                })

    return jsonify({
        "query": query,
        "priority": priority,
        "count": len(matched_products),
        "results": matched_products
    })

# --------------------------------------------------
# Run the Flask app
# --------------------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
