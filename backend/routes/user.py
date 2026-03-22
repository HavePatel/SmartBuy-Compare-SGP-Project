from flask import Blueprint, jsonify, request, session

from backend.extensions import db
from backend.models import SavedProduct, TrackedProduct, User, PriceAlert

bp = Blueprint("user", __name__, url_prefix="/user")


def require_user_id():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return user_id


def saved_product_to_dict(sp: SavedProduct) -> dict:
    return {
        "id": sp.id,
        "user_id": sp.user_id,
        "product_id": sp.product_id,
        "product_name": sp.product_name,
        "brand": sp.brand,
        "created_at": sp.created_at.isoformat() if sp.created_at else None,
    }


@bp.post("/save-product")
def save_product():
    user_id = require_user_id()
    print("Session user_id:", session.get("user_id"))
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}
    product_id = str(data.get("product_id", "")).strip()
    product_name = str(data.get("product_name", "")).strip()
    brand = str(data.get("brand", "")).strip()

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    if not product_name:
        return jsonify({"error": "product_name is required"}), 400
    if not brand:
        return jsonify({"error": "brand is required"}), 400

    # Ensure the user exists (defensive; session should already imply this).
    user = User.query.get(user_id)
    if user is None:
        session.clear()
        return jsonify({"error": "Please login first"}), 401

    existing = SavedProduct.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({"success": True, "saved": False, "saved_product": saved_product_to_dict(existing)})

    sp = SavedProduct(
        user_id=user_id,
        product_id=product_id,
        product_name=product_name,
        brand=brand,
    )
    db.session.add(sp)
    db.session.commit()

    return jsonify({"success": True, "saved": True, "saved_product": saved_product_to_dict(sp)})


@bp.get("/saved-products")
def saved_products():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    saved = (
        SavedProduct.query.filter_by(user_id=user_id)
        .order_by(SavedProduct.created_at.desc())
        .all()
    )
    return jsonify({"saved_products": [saved_product_to_dict(sp) for sp in saved]})


@bp.delete("/remove-product")
def remove_product():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}
    product_id = str(data.get("product_id", "")).strip()

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    sp = SavedProduct.query.filter_by(user_id=user_id, product_id=product_id).first()
    if sp is None:
        return jsonify({"success": True, "removed": False})

    db.session.delete(sp)
    db.session.commit()
    return jsonify({"success": True, "removed": True})


def tracked_product_to_dict(tp: TrackedProduct) -> dict:
    return {
        "id": tp.id,
        "user_id": tp.user_id,
        "product_id": tp.product_id,
        "product_name": tp.product_name,
        "brand": tp.brand,
        "target_price": tp.target_price,
        "created_at": tp.created_at.isoformat() if tp.created_at else None,
    }


@bp.post("/track-product")
def track_product():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}
    product_id = str(data.get("product_id", "")).strip()
    product_name = str(data.get("product_name", "")).strip()
    brand = str(data.get("brand", "")).strip()
    target_price = data.get("target_price")

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400
    if not product_name:
        return jsonify({"error": "product_name is required"}), 400
    if not brand:
        return jsonify({"error": "brand is required"}), 400

    user = User.query.get(user_id)
    if user is None:
        session.clear()
        return jsonify({"error": "Please login first"}), 401

    existing = TrackedProduct.query.filter_by(user_id=user_id, product_id=product_id).first()
    if existing:
        return jsonify({"success": True, "tracked": False, "tracked_product": tracked_product_to_dict(existing)})

    tp = TrackedProduct(
        user_id=user_id,
        product_id=product_id,
        product_name=product_name,
        brand=brand,
        target_price=float(target_price) if target_price is not None else None,
    )
    db.session.add(tp)
    db.session.commit()

    return jsonify({"success": True, "tracked": True, "tracked_product": tracked_product_to_dict(tp)})


@bp.get("/tracked-products")
def tracked_products():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    tracked = (
        TrackedProduct.query.filter_by(user_id=user_id)
        .order_by(TrackedProduct.created_at.desc())
        .all()
    )
    return jsonify({"tracked_products": [tracked_product_to_dict(tp) for tp in tracked]})


@bp.delete("/untrack-product")
def untrack_product():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}
    product_id = str(data.get("product_id", "")).strip()

    if not product_id:
        return jsonify({"error": "product_id is required"}), 400

    tp = TrackedProduct.query.filter_by(user_id=user_id, product_id=product_id).first()
    if tp is None:
        return jsonify({"success": True, "untracked": False})

    db.session.delete(tp)
    db.session.commit()
    return jsonify({"success": True, "untracked": True})


def price_alert_to_dict(pa: PriceAlert) -> dict:
    return {
        "id": pa.id,
        "user_id": pa.user_id,
        "product_id": pa.product_id,
        "product_name": pa.product_name,
        "old_price": pa.old_price,
        "new_price": pa.new_price,
        "is_high_priority": pa.is_high_priority,
        "is_read": pa.is_read,
        "created_at": pa.created_at.isoformat() if pa.created_at else None,
    }


@bp.get("/alerts")
def get_alerts():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    alerts = (
        PriceAlert.query.filter_by(user_id=user_id)
        .order_by(PriceAlert.created_at.desc())
        .all()
    )
    return jsonify({"alerts": [price_alert_to_dict(a) for a in alerts]})


@bp.post("/mark-alert-read")
def mark_alert_read():
    user_id = require_user_id()
    if not user_id:
        return jsonify({"error": "Please login first"}), 401

    data = request.get_json(silent=True) or {}
    alert_id = data.get("alert_id")

    if alert_id is None:
        return jsonify({"error": "alert_id is required"}), 400

    alert = PriceAlert.query.filter_by(id=alert_id, user_id=user_id).first()
    if not alert:
        return jsonify({"error": "Alert not found"}), 404

    alert.is_read = True
    db.session.commit()
    return jsonify({"success": True})

