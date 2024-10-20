from flask import Flask, render_template, g
import os

app = Flask(__name__, instance_relative_config=True)

app.config.from_mapping(
    SECRET_KEY="dev",
    DATABASE=os.path.join(app.instance_path, "smarter.sqlite")
)

app.config.from_pyfile("config.py", silent=True)

# Create the instance folder if necessary
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

@app.before_request
def load_categories():
    g.categories = {
        9: "General Knowledge",
        10: "Entertainment: Books",
        11: "Entertainment: Film",
        12: "Entertainment: Music",
        13: "Entertainment: Musicals & Theatres",
        14: "Entertainment: Television",
        15: "Entertainment: Video Games",
        16: "Entertainment: Board Games",
        17: "Science & Nature",
        18: "Science: Computers",
        19: "Science: Mathematics",
        20: "Mythology",
        21: "Sports",
        22: "Geography",
        23: "History",
        24: "Politics",
        25: "Art",
        26: "Celebrities",
        27: "Animals",
        28: "Vehicles",
        29: "Entertainment: Comics",
        30: "Science: Gadgets",
        31: "Entertainment: Japanese Anime & Manga",
        32: "Entertainment: Cartoon & Animations"
    }

from . import auth
from . import api
from . import questions
from . import about
from . import admin
from . import db

app.register_blueprint(auth.bp)
app.register_blueprint(api.bp)
app.register_blueprint(questions.bp)
app.register_blueprint(about.bp)
app.register_blueprint(admin.bp)

admin.init_app(app)
db.init_app(app)

@app.route("/")
def index():
    return render_template("index.html")
