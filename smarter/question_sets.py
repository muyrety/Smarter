from flask import Blueprint, render_template

bp = Blueprint("question_sets", __name__, url_prefix="/question-sets")

@bp.route("/browse")
def browse():
    return render_template("question-sets/browse.html")

@bp.route("/add")
def add():
    return render_template("question-sets/add.html")
