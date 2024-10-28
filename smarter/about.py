from flask import Blueprint, render_template

bp = Blueprint("about", __name__, url_prefix="/about")

@bp.route("/opentdb")
def opentdb():
    return render_template("about/opentdb.html")

@bp.route("/why-was-my-question-removed")
def question_removed():
    return render_template("about/question_removed.html")
