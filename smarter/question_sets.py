from flask import Blueprint, render_template, request, flash, redirect, url_for
from .db import get_db
from .constants import categories
from better_profanity import profanity
from .auth import login_required

bp = Blueprint("question_sets", __name__, url_prefix="/question-sets")

@bp.route("/browse")
def browse():
    return render_template("question-sets/browse.html")

@bp.route("/add", methods = ["GET", "POST"])
@login_required()
def add():
    if request.method == "GET":
        return render_template("question-sets/add.html")

    name = request.form.get("name")
    error = None
    if not name:
        error = "Name is required"
    elif profanity.contains_profanity(name):
        error = "Question set name contains profanity"

    if error is not None:
        flash(error, "danger")
        return render_template("question-sets/add.html")

    return redirect(url_for("question_sets.add_user_generated", name=name, temp=request.form.get("temp")))

@bp.route("/add/user-generated")
@login_required()
def add_user_generated():
    questions = get_db().execute(
        """SELECT q.id, q.category, q.difficulty, q.question, u.username AS creator
        FROM questions AS q JOIN users AS u ON u.id = q.creator_id WHERE q.source = 'user'"""
    ).fetchall()

    # Replace category numbers with strings
    for question in questions:
        question["category"] = categories[question["category"]]

    return render_template("question-sets/add_user_questions.html", questions=questions)

@bp.route("/add/opentdb")
@login_required()
def add_opentdb():
    return render_template("question-sets/add_otdb_questions.html")
