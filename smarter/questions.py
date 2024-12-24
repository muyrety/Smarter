from flask import (
    Blueprint, render_template, request, flash,
    redirect, url_for, g
)

from .auth import login_required
from .db import get_db
from .constants import categories
from .helpers import submitQuestion
from better_profanity import profanity

bp = Blueprint("questions", __name__, url_prefix="/questions")


@bp.route("/add", methods=["GET", "POST"])
@login_required()
def add():
    if request.method == "GET":
        return render_template("questions/add.html")

    # Validate input
    error = None

    difficulty = request.form["difficulty"]
    question_type = request.form["type"]
    question = request.form["question"]
    category = None
    incorrect_answers = None
    correct_answer = None

    try:
        category = int(request.form["category"])
    except ValueError:
        flash("Bad category", "danger")
        return render_template("questions/add.html")

    if category not in range(9, 33):
        error = "Bad category"
    elif not question:
        error = "Bad question"
    elif profanity.contains_profanity(question):
        error = "Profanity detected in question"
    elif difficulty not in ["easy", "medium", "hard"]:
        error = "Bad difficulty"
    elif question_type not in ["boolean", "multiple"]:
        error = "Bad question type"
    elif question_type == "boolean":
        correct_answer = request.form["correctAnswerBoolean"]
        incorrect_answers = ["False" if correct_answer == "True" else "True"]
        if correct_answer not in ["True", "False"]:
            error = "Bad boolean question answer"
    elif question_type == "multiple":
        correct_answer = request.form["correctAnswerMultiple"]
        incorrect_answers = request.form.getlist("incorrectAnswers")
        if len(incorrect_answers) != 3 or "" in incorrect_answers:
            error = "Bad incorrect answers"

    if error is not None:
        flash(error, "danger")
        return render_template("questions/add.html")

    # Insert the question into the database
    id, error = submitQuestion("user", question_type, g.user["id"],
                               category, difficulty, question,
                               correct_answer, incorrect_answers)
    if error is not None:
        flash(error, "danger")
        return render_template("questions/add.html")

    flash("Question successfuly submited", "success")
    return redirect(url_for("index"))


@bp.route("/browse/otdb")
def otdb_browse():
    return render_template("questions/otdb_browse.html")


@bp.route("/browse/user-generated")
def user_browse():
    questions = get_db().execute(
        """SELECT q.id, q.category, q.difficulty, q.question,
        u.username AS creator
        FROM questions AS q JOIN users AS u ON u.id = q.creator_id
        WHERE q.source = 'user'"""
    ).fetchall()

    # Replace category numbers with strings
    for question in questions:
        question["category"] = categories[question["category"]]

    return render_template("questions/user_browse.html", questions=questions)
