from flask import Blueprint, render_template

bp = Blueprint("game", __name__)


@bp.route("/create")
def create_game():
    return render_template("index.html")
