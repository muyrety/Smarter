from flask import Blueprint, render_template
from .auth import login_required

bp = Blueprint("questions", __name__, url_prefix="/questions")

@bp.route("/add")
@login_required
def add():
    return render_template("add_questions.html")

@bp.route("/browse/otdb")
def otdb_browse():
    return render_template("otdb_browse.html")

@bp.route("/browse/user-generated")
def user_browse():
    return render_template("user_browse.html")
