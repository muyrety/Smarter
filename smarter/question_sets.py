from flask import Blueprint

bp = Blueprint("question_sets", __name__, url_prefix="/question-sets")

@bp.route("/browse")
def browse():
    return "BROWSE"

@bp.route("/add")
def add():
    return "ADD"
