from flask import Flask, render_template, request, g, redirect
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3

app = Flask(__name__)

DATABASE = "smarter.db"

def get_db():
    db = getattr(g, "_database", None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, "_database", None)
    if db is not None:
        db.close()

# Lauch for initial database creation
def init_db():
    with app.app_context():
        db = get_db()
        with app.open_resource("schema.sql", mode="r") as f:
            db.cursor().executescript(f.read())
        db.commit()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/register", methods = ["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username")
    password = request.form.get("password")
    if not username or not password:
        return render_template("error.html", message="One or more fields missing")

    db = get_db()
    cur = db.cursor()
    users = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
    db.commit()

    if len(users) != 0:
        return render_template("error.html", message="This username is taken")

    if len(password) < 8:
        return render_template("error.html", message="Password too short")

    cur = db.cursor()
    cur.execute("INSERT INTO users(username, hash) VALUES(?, ?)",
                (username, generate_password_hash(password)))
    db.commit()
    
    return redirect("/")
