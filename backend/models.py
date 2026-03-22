from datetime import datetime

from .extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255), nullable=False)
    profile_image = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


class SavedProduct(db.Model):
    __tablename__ = "saved_products"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    # Stored as string to keep this DB flexible (even if product_id is numeric).
    product_id = db.Column(db.String(255), nullable=False)
    product_name = db.Column(db.String(500), nullable=False)
    brand = db.Column(db.String(255), nullable=False)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Prevent duplicate saves per user.
    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_saved_products_user_product_id"),
    )

    user = db.relationship("User", backref="saved_products")


class TrackedProduct(db.Model):
    __tablename__ = "tracked_products"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    product_id = db.Column(db.String(255), nullable=False)
    product_name = db.Column(db.String(500), nullable=False)
    brand = db.Column(db.String(255), nullable=False)
    target_price = db.Column(db.Float, nullable=True)

    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Prevent duplicate tracking per user.
    __table_args__ = (
        db.UniqueConstraint("user_id", "product_id", name="uq_tracked_products_user_product_id"),
    )

    user = db.relationship("User", backref="tracked_products")


class PriceAlert(db.Model):
    __tablename__ = "price_alerts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)

    product_id = db.Column(db.String(255), nullable=False)
    product_name = db.Column(db.String(500), nullable=False)
    
    old_price = db.Column(db.Float, nullable=False)
    new_price = db.Column(db.Float, nullable=False)
    
    is_high_priority = db.Column(db.Boolean, nullable=False, default=False)
    is_read = db.Column(db.Boolean, nullable=False, default=False)
    
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    user = db.relationship("User", backref="price_alerts")


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(255), primary_key=True)
    name = db.Column(db.String(500), nullable=False)
    brand = db.Column(db.String(255), nullable=False)
    category = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.String(1000), nullable=True)

    offers = db.relationship("Offer", backref="product", lazy=True, cascade="all, delete-orphan")
    price_history = db.relationship("PriceHistory", backref="product", lazy=True, cascade="all, delete-orphan")


class Offer(db.Model):
    __tablename__ = "offers"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(255), db.ForeignKey("products.id"), nullable=False, index=True)
    platform = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    delivery_days = db.Column(db.Integer, nullable=False)
    last_updated = db.Column(db.String(50), nullable=False)
    product_url = db.Column(db.String(1000), nullable=True)


class PriceHistory(db.Model):
    __tablename__ = "price_history"

    id = db.Column(db.Integer, primary_key=True)
    product_id = db.Column(db.String(255), db.ForeignKey("products.id"), nullable=False, index=True)
    platform = db.Column(db.String(255), nullable=False)
    price = db.Column(db.Float, nullable=False)
    recorded_at = db.Column(db.String(50), nullable=False)



