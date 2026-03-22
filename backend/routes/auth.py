from flask import Blueprint, jsonify, request, session, redirect

from backend.extensions import db
from backend.models import User

bp = Blueprint("auth", __name__, url_prefix="/auth")


def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "profile_image": user.profile_image,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@bp.post("/login")
def login():
    """
    POST /auth/login
    Body (JSON): { "email": "...", "name": "..." }

    - If user exists: log them in (store user_id in session)
    - If not: create user, then log them in
    """
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    name = str(data.get("name", "")).strip()

    if not email:
        return jsonify({"error": "email is required"}), 400
    if not name:
        return jsonify({"error": "name is required"}), 400

    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(email=email, name=name)
        db.session.add(user)
        db.session.commit()

    session["user_id"] = user.id
    return jsonify({"user": user_to_dict(user)})


@bp.post("/logout")
def logout():
    """
    POST /auth/logout
    - Clears session
    """
    session.clear()
    return jsonify({"success": True})


@bp.get("/me")
def me():
    """
    GET /auth/me
    - Returns current logged-in user from session, or JSON null if not logged in.
    """
    user_id = session.get("user_id")
    if not user_id:
        return jsonify(None)

    user = User.query.get(user_id)
    if user is None:
        # Session refers to a user that no longer exists.
        session.clear()
        return jsonify(None)

    return jsonify(user_to_dict(user))


@bp.get("/google/login")
def google_login():
    from backend.extensions import oauth
    from flask import url_for
    redirect_uri = url_for("auth.google_callback", _external=True)
    session["next_url"] = request.args.get("next")
    return oauth.google.authorize_redirect(redirect_uri)


@bp.get("/google/callback")
def google_callback():
    from backend.extensions import oauth
    import requests
    
    try:
        token = oauth.google.authorize_access_token()
        userinfo = token.get("userinfo")
    except Exception as e:
        code = request.args.get("code")
        if not code:
            return jsonify({"error": f"OAuth Error: {str(e)}"}), 400
            
        from flask import current_app, url_for
        client_id = current_app.config.get("GOOGLE_CLIENT_ID")
        client_secret = current_app.config.get("GOOGLE_CLIENT_SECRET")
        redirect_uri = url_for("auth.google_callback", _external=True)
        
        resp = requests.post("https://oauth2.googleapis.com/token", data={
            "client_id": client_id,
            "client_secret": client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": redirect_uri
        })
        token_data = resp.json()
        if "access_token" not in token_data:
            return jsonify({"error": "Failed fallback token exchange", "google_response": token_data, "authlib_error": str(e)}), 400
            
        info_resp = requests.get("https://www.googleapis.com/oauth2/v3/userinfo", 
                                 headers={"Authorization": f"Bearer {token_data['access_token']}"})
        userinfo = info_resp.json()

    if not userinfo:
        return jsonify({"error": "Failed to fetch user info from Google."}), 400

    email = str(userinfo.get("email", "")).strip().lower()
    name = str(userinfo.get("name", "")).strip()
    profile_picture = str(userinfo.get("picture", "")).strip()

    user = User.query.filter_by(email=email).first()
    if user is None:
        user = User(email=email, name=name, profile_image=profile_picture)
        db.session.add(user)
    else:
        user.name = name
        if profile_picture:
            user.profile_image = profile_picture

    db.session.commit()
    session["user_id"] = user.id

    next_url = session.get("next_url")
    if next_url:
        return redirect(next_url)
    return jsonify({"success": True, "message": "Logged in via Google. Please close this window and refresh."})
