from flask import Blueprint, jsonify, request
from sqlalchemy import func
from backend.models import Product, Offer, PriceHistory

bp = Blueprint("products", __name__)

# --------------------------------------------------
# Ranking Logic
# --------------------------------------------------

def rank_offers(offers, priority):
    if priority == "fast":
        return sorted(offers, key=lambda x: (x["delivery_days"], x["price"]))
    if priority == "cheap":
        return sorted(offers, key=lambda x: (x["price"], x["delivery_days"]))
    if priority == "balanced":
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


def normalize_text(text):
    return text.lower().replace(" ", "").replace("-", "")


def get_best_reason(best_offer, priority):
    if priority == "cheap":
        return "Best because it is the lowest priced option"
    if priority == "fast":
        return f"Best because it delivers fastest ({best_offer['delivery_days']} days)"
    return "Best balance of price and delivery time"


# --------------------------------------------------
# API: Get all products
# --------------------------------------------------

@bp.route("/api/products", methods=["GET"])
def get_products():
    products = Product.query.all()
    return jsonify([
        {"id": p.id, "name": p.name, "brand": p.brand, "category": p.category}
        for p in products
    ])


# --------------------------------------------------
# API: Get single product details
# --------------------------------------------------

@bp.route("/api/product", methods=["GET"])
def get_single_product():
    product_id = request.args.get("id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    product = Product.query.filter_by(id=product_id).first()
    if not product:
        return jsonify({"error": "Product not found"}), 404

    offers_list = [
        {
            "id": o.id,
            "product_id": o.product_id,
            "platform": o.platform,
            "price": o.price,
            "delivery_days": o.delivery_days,
            "last_updated": o.last_updated,
            "product_url": o.product_url
        } for o in product.offers
    ]

    from backend.services.product_service import get_live_product_data
    live_offers = get_live_product_data(product.id, offers_list)

    # Sort cheapest first for the dedicated page display
    ranked_offers = rank_offers(live_offers, "cheap")

    best_reason = ""
    if ranked_offers:
        best_reason = get_best_reason(ranked_offers[0], "cheap")

    history = PriceHistory.query.filter_by(product_id=product.id).order_by(PriceHistory.recorded_at.asc()).all()
    history_data = [
        {"platform": h.platform, "price": h.price, "recorded_at": h.recorded_at}
        for h in history
    ]

    return jsonify({
        "id": product.id,
        "name": product.name,
        "brand": product.brand,
        "category": product.category,
        "image_url": product.image_url,
        "offers": ranked_offers,
        "best_reason": best_reason,
        "history": history_data
    })


# --------------------------------------------------
# API: Price History
# --------------------------------------------------

@bp.route("/api/price-history", methods=["GET"])
def get_price_history():
    product_id = request.args.get("product_id")
    history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.recorded_at).all()
    return jsonify([
        {"id": h.id, "product_id": h.product_id, "platform": h.platform, "price": h.price, "recorded_at": h.recorded_at}
        for h in history
    ])


# --------------------------------------------------
# API: Product Insights
# --------------------------------------------------

@bp.route("/api/product/insights", methods=["GET"])
def product_insights():
    product_id = request.args.get("product_id")
    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    history = PriceHistory.query.filter_by(product_id=product_id).order_by(PriceHistory.recorded_at.asc()).all()

    if not history:
        return jsonify({
            "lowest_price": 0,
            "highest_price": 0,
            "average_price": 0,
            "current_price": 0,
            "recommendation": "wait"
        })

    prices = [float(row.price) for row in history]
    lowest_price = min(prices)
    highest_price = max(prices)
    average_price = sum(prices) / len(prices)
    current_price = prices[-1]

    recent_prices = prices[-5:] if len(prices) >= 5 else prices
    if len(recent_prices) > 1:
        if recent_prices[-1] > recent_prices[0]:
            trend = "increasing"
        elif recent_prices[-1] < recent_prices[0]:
            trend = "decreasing"
        else:
            trend = "stable"
    else:
        trend = "stable"

    recommendation = "wait"
    reason = "Price is currently high compared to the historical average."
    
    if current_price < average_price:
        recommendation = "buy"
        percent_diff = round(((average_price - current_price) / average_price) * 100)
        reason = f"Price is {percent_diff}% lower than average. Good time to buy!"
    elif trend == "increasing":
        recommendation = "buy"
        reason = "Prices form an upward trend. Buy now before it gets more expensive!"

    return jsonify({
        "lowest_price": round(lowest_price, 2),
        "highest_price": round(highest_price, 2),
        "average_price": round(average_price, 2),
        "current_price": round(current_price, 2),
        "recommendation": recommendation,
        "reason": reason,
        "trend": trend
    })


# --------------------------------------------------
# API: Search
# --------------------------------------------------

@bp.route("/api/search", methods=["GET"])
def search_products():
    query = request.args.get("query", "")
    priority = request.args.get("priority", "balanced").lower()
    category_filter = request.args.get("category", "").lower()

    sql_query = Product.query

    if query:
        normalized_query = normalize_text(query)
        norm_col = func.replace(func.replace(func.lower(Product.name), ' ', ''), '-', '')
        sql_query = sql_query.filter(norm_col.like(f"%{normalized_query}%"))

    if category_filter:
        sql_query = sql_query.filter(func.lower(Product.category) == category_filter)

    products = sql_query.all()
    matched_products = []

    for product in products:
        offers_list = [
            {
                "id": o.id,
                "product_id": o.product_id,
                "platform": o.platform,
                "price": o.price,
                "delivery_days": o.delivery_days,
                "last_updated": o.last_updated,
                "product_url": o.product_url
            } for o in product.offers
        ]

        from backend.services.product_service import get_live_product_data
        live_offers = get_live_product_data(product.id, offers_list)

        ranked_offers = rank_offers(live_offers, priority)

        best_reason = ""
        if ranked_offers:
            best_reason = get_best_reason(ranked_offers[0], priority)

        matched_products.append(
            {
                "category": product.category,
                "product_id": product.id,
                "product_name": product.name,
                "brand": product.brand,
                "offers": ranked_offers,
                "best_reason": best_reason,
                "upcoming_deal": None,
            }
        )

    return jsonify(
        {
            "query": query,
            "priority": priority,
            "count": len(matched_products),
            "results": matched_products,
        }
    )

