from flask import Flask, render_template, request, g, redirect, abort, jsonify
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

@app.route("/api/check_username", methods = ["POST"])
def check_username():
    db = get_db()
    cur = db.cursor()
    users = cur.execute("SELECT * FROM users WHERE username = ?", (request.json["username"],)).fetchall()
    db.commit()

    # If there are no users with the same name, the username is available
    return jsonify({"available": not bool(users)})


@app.route("/register", methods = ["GET", "POST"])
def register():
    if request.method == "GET":
        return render_template("register.html")

    username = request.form.get("username").strip()
    password = request.form.get("password")
    if not username or not password:
        abort(400)
        #return render_template("error.html", code=400, message="One or more fields missing"), 400

    db = get_db()
    cur = db.cursor()
    users = cur.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
    db.commit()

    if len(users) != 0:
        abort(409)
        #return render_template("error.html", code=409, message="This username is taken"), 409

    if len(password) < 8:
        abort(400)
        #return render_template("error.html", code=400, message="Password too short"), 400

    cur = db.cursor()
    cur.execute("INSERT INTO users(username, hash) VALUES(?, ?)",
                (username, generate_password_hash(password)))
    db.commit()
    
    return redirect("/")
