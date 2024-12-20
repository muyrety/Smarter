import functools
import re
from flask import (
    Blueprint, redirect, url_for, g, session, request, flash,
    render_template, abort
)
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db

from .helpers import get_notifications
from better_profanity import profanity

bp = Blueprint("auth", __name__, url_prefix="/auth")


def login_required(admin=False):
    def decorator(f):
        @functools.wraps(f)
        def decorated_function(*args, **kwargs):
            if g.user is None:
                return redirect(url_for('auth.login', next=request.url))
            elif admin and not g.user["admin"]:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator


@bp.before_app_request
def load_logged_in_user():
    """If a user id is stored in the session, load the user object from
    the database into g.user"""
    user_id = session.get("user_id")

    if user_id is None:
        g.user = None
    else:
        db = get_db()
        g.user = db.execute(
            "SELECT * FROM users WHERE id = ?", (user_id,)
        ).fetchone()

        # Check if user is an admin
        admin = db.execute(
            "SELECT * FROM admins WHERE user_id = ?", (user_id,)
        ).fetchone()
        if admin is None:
            g.user["admin"] = False
        else:
            g.user["admin"] = True

        # Flash any messages left for the user
        notifications = get_notifications(user_id)
        for notification in notifications:
            flash(notification["notification"], notification["category"])


@bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("auth/register.html")

    username = request.form["username"]
    password = request.form["password"]
    repeat_password = request.form["repeatPassword"]
    error = None

    if not username or not password or not repeat_password:
        error = "Missing one or more fields"
    elif re.search(r"\s", username):
        error = "Usernames cannot have whitespace"
    elif profanity.contains_profanity(username):
        error = "Profanity detected in username"
    elif len(password) < 8:
        error = "Password is not long enough"
    elif password != repeat_password:
        error = "Passwords don't match"

    if error is None:
        db = get_db()
        try:
            # Register the user
            user_id = db.execute(
                "INSERT INTO users(username, hash) VALUES(?, ?)",
                (username, generate_password_hash(password))
            ).lastrowid
            db.commit()
        except db.IntegrityError:
            error = "Username already taken"
        else:
            # Remember user
            session.permanent = False
            session["user_id"] = user_id
            flash("You have successfully registered", "success")
            return redirect(url_for("index"))

    flash(error, "danger")
    return render_template("auth/register.html")


@bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("auth/login.html")

    next = request.form["next"]
    username = request.form["username"].strip()
    password = request.form["password"]
    error = None

    db = get_db()
    user_data = db.execute(
        "SELECT id, hash FROM users WHERE username = ?", (username,)
    ).fetchone()

    if user_data is None:
        error = "Wrong username"
    elif not check_password_hash(user_data["hash"], password):
        error = "The password you entered is incorrect"

    if error is not None:
        flash(error, "danger")

        # Keep the next argument between requests
        if next:
            return redirect(url_for("auth.login", next=next))

        return render_template("auth/login.html")

    # Remember user
    if request.form.get("remember_password"):
        session.permanent = True
    else:
        session.permanent = False
    session["user_id"] = user_data["id"]

    flash("You have successfully logged-in", "success")

    return redirect(next if next else url_for("index"))


@bp.route("/logout")
def logout():
    session.clear()
    flash("You are now logged out", "success")
    return redirect(url_for("index"))
