from flask import Blueprint, request
from .db import get_db

bp = Blueprint("api", __name__, url_prefix="/api")

@bp.route("/check_username")
def check_username():
    username = request.args["username"]
    db = get_db()
    users = db.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    return {"taken": bool(users)}
