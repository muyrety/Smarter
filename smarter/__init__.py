from flask import Flask, url_for, redirect
import os

from . import auth
from . import questions
from . import about
from . import admin
from . import game
from . import db
from . import question_sets

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

# Register all blueprints
app.register_blueprint(auth.bp)
app.register_blueprint(questions.bp)
app.register_blueprint(about.bp)
app.register_blueprint(admin.bp)
app.register_blueprint(game.bp)
app.register_blueprint(question_sets.bp)

# Register app with some select files (database managment and admin commands
admin.init_app(app)
db.init_app(app)


@app.route("/")
def index():
    return redirect(url_for("questions.user_browse"))
