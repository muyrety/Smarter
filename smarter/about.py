from flask import Blueprint, render_template

bp = Blueprint("about", __name__, url_prefix="/about")


@bp.route("/")
def index():
    return render_template("about/index.html")


@bp.route("/opentdb")
def opentdb():
    return render_template("about/opentdb.html")


@bp.route("/why-was-my-question-removed")
def question_removed():
    return render_template("about/question_removed.html")


@bp.route("/license")
def license():
    return render_template("about/license.html")


@bp.route("/contacts")
def contacts():
    return render_template("about/contacts.html")


@bp.route("/temporary-question-sets")
def temp_sets():
    return render_template("about/temp_sets.html")
