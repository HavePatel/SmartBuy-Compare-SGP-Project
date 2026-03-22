import os
import sys

# Allow OAuth HTTP transport for local dev 
os.environ["AUTHLIB_INSECURE_TRANSPORT"] = "1"

from flask import Flask
from flask_cors import CORS

# When running `python backend/app.py`, Python's import path doesn't include
# the repository root by default. This makes `import backend.*` work.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

from backend.config import Config
from backend.extensions import db, oauth
from backend.routes.auth import bp as auth_bp
from backend.routes.products import bp as products_bp
from backend.routes.user import bp as user_bp


def create_app():
    FRONTEND_FOLDER = os.path.join(REPO_ROOT, "frontend")
    app = Flask(__name__, static_folder=FRONTEND_FOLDER, static_url_path="/")
    app.config.from_object(Config)

    # Flask sessions rely on a secret key.
    app.secret_key = app.config["SECRET_KEY"]

    # Ensure cross-origin requests don't drop the session cookie
    app.config.update(
        SESSION_COOKIE_SAMESITE="None",
        SESSION_COOKIE_SECURE=True,
    )

    # Keep existing frontend requests working and allow cookie-based sessions.
    # Allow common local frontend origins (including `file://` -> Origin: null)
    # so cookie-based sessions work with `fetch(..., credentials: "include")`.
    CORS(
        app,
        supports_credentials=True,
        origins=[
            "null",
            r"http://127\.0\.0\.1:\d+",
            r"http://localhost:\d+",
        ],
    )

    # Initialize SQLAlchemy.
    db.init_app(app)

    # Initialize Authlib OAuth
    oauth.init_app(app)
    if app.config.get("GOOGLE_CLIENT_ID") and app.config.get("GOOGLE_CLIENT_SECRET"):
        oauth.register(
            name="google",
            server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
            client_kwargs={"scope": "openid email profile"},
        )

    # Register blueprints (keeps existing product/search APIs intact).
    app.register_blueprint(products_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(user_bp)

    # Import models so SQLAlchemy knows about them.
    from backend import models  # noqa: F401

    @app.route("/")
    def serve_frontend_index():
        return app.send_static_file("index.html")
        
    @app.route("/dashboard")
    def serve_dashboard():
        return app.send_static_file("dashboard.html")

    with app.app_context():
        # Step 1: prepare the auth DB schema (User table only).
        db.create_all()

    return app

# (Product and search endpoints were moved into `backend/routes/products.py`.)

if __name__ == "__main__":
    create_app().run(debug=True)