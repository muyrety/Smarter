from flask import Flask, render_template
import os

app = Flask(__name__, instance_relative_config=True)

app.config.from_mapping(
    SECRET_KEY="dev",
    DATABASE=os.path.join(app.instance_path, "smarter.sqlite"),
)

app.config.from_pyfile("config.py", silent=True)

# Create the instance folder if necessary
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

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
