from flask import Flask, redirect, url_for
import os

from .sockets import socketio
from . import auth
from . import questions
from . import about
from . import admin
from . import game
from . import db
from . import question_sets

app = Flask(__name__, instance_relative_config=True)

app.config.from_mapping(
    # SECURITY NOTICE:
    # Make sure to set the SECRET_KEY environment variable for production use.
    # Fallback to 'dev' is only for local development.
    SECRET_KEY=os.environ.get("SECRET_KEY", "dev"),
    
    # DATABASE path can be overridden with DATABASE_URL env variable for production deployments.
    DATABASE=os.environ.get("DATABASE_URL", os.path.join(app.instance_path, "smarter.sqlite")),
    
    BETA_VERSION=False
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

# Register app with some select modules
admin.init_app(app)
db.init_app(app)

socketio.init_app(app)


@app.route("/")
def index():
    return redirect(url_for("question_sets.browse"))
