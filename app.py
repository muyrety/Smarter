from flask import Flask, render_template, request, g, redirect, abort, url_for, session
from werkzeug.security import generate_password_hash, check_password_hash
import os
import sqlite3
import re

app = Flask(__name__)
app.secret_key = os.environ["smarter_key"]

""" Database configuration for sqlite3 """

DATABASE = "smarter.db"

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

# Lauch to create database
def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource("schema.sql", mode="r") as f:
            db.cursor().executescript(f.read())
        db.commit()


""" API for interacting with the server using javascript """

@app.route("/api/check_username")
def check_username():
    username = request.args.get("username")
    if not username:
        abort(400)
        
    db = get_db()
    cur = db.cursor()
    users = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.commit()
    return {"taken": bool(users)}

@app.route("/api/get_questions")
def get_questions():
    try:
        # ID from which to receive the questions
        # e.g. id=9 would request the questions 9-[amount]
        question_id = int(request.args.get("id", 1))
        amount = int(request.args.get("amount", 50))

        # Category (as an integer) value. 0 corresponds to any category.
        category = int(request.args.get("category", 0))
    except ValueError:
        abort(400)

    difficulty = request.args.get("difficulty", "any")
    if difficulty not in ["easy", "medium", "hard", "any"]:
        abort(400)
    return redirect(url_for("index"))


@app.route("/")
def index():
    return render_template("index.html")

@app.route("/browse")
def browse():
    return render_template("browse.html")

@app.route("/about/opentdb")
def opentdb():
    return render_template("opentdb.html")

@app.route("/register", methods = ["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username")
    password = request.form.get("password")
    repeat_password = request.form.get("repeatPassword")

    if not username or not password or not repeat_password:
        abort(400)

    if re.search("\s", username):
        abort(400)

    db = get_db()
    cur = db.cursor()
    existing_user = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    db.commit()

    # Abort if another user with the same username exists
    if existing_user:
        abort(409)

    if len(password) < 8 or password != repeat_password:
        abort(400)
    
    # Register the user
    cur = db.cursor()
    cur.execute("INSERT INTO users(username, hash) VALUES(?, ?)",
                    (username, generate_password_hash(password)))
    db.commit()
        
    # Remember user
    cur = db.cursor()
    cur.execute("SELECT id FROM users WHERE username = ?", (username,))
    session.permanent = False
    session["user_id"] = cur.fetchone()[0]
    db.commit()

    return redirect(url_for("index"))

@app.route("/login", methods = ["GET", "POST"])
def login():
    if request.method == "GET":
        return render_template("login.html", badPassword=False)

    username = request.form.get("username")
    password = request.form.get("password")

    if not username or not password:
        abort(400)

    db = get_db()
    cur = db.cursor()
    user_data = cur.execute("SELECT id, hash FROM users WHERE username = ?", (username,)).fetchone()
    db.commit()

    # If user not found
    if not user_data:
        abort(400)

    # Reload the login form with a message if password is incorrect
    if not check_password_hash(user_data[1], password):
        return render_template("login.html", badPassword=True)

    # Remember user
    if request.form.get("remember_password"):
        session.permanent = True
    else:
        session.permanent = False
    session["user_id"] = user_data[0]

    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    session.pop("user_id", None)
    return redirect(url_for("index"))


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

