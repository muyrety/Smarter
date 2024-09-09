from flask import Flask, render_template, request, g, redirect, abort, jsonify, url_for
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)


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

# API for checking username availability with javascript
@app.route("/api/check_username", methods = ["POST"])
def check_username():
    try:
        db = get_db()
        cur = db.cursor()
        users = cur.execute("SELECT * FROM users WHERE username = ?", (request.json["username"],)).fetchall()
    except sqlite3.Error:
        db.commit()
        abort(500)
    db.commit()
        
    return {"available": not bool(users)}


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/register", methods = ["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username").strip()
    password = request.form.get("password")
    if not username or not password:
        abort(400)

    try:
        db = get_db()
        cur = db.cursor()
        users = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
    except sqlite3.Error:
        db.commit()
        abort(500)
    db.commit()

    if len(users) != 0:
        abort(409)

    if len(password) < 8:
        abort(400)
    
    try:
        cur = db.cursor()
        cur.execute("INSERT INTO users(username, hash) VALUES(?, ?)",
                    (username, generate_password_hash(password)))
    except sqlite3.Error:
        db.commit()
        abort(500) 
    db.commit()
        
    return redirect(url_for("index"))

@app.route("/logout")
def logout():
    return redirect(url_for("index"))


@app.route("/login")
def login():
    return redirect(url_for("index"))


@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

