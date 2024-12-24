from flask import (
    Blueprint, render_template, request,
    flash, redirect, url_for, g
)
from better_profanity import profanity
from .db import get_db
from .constants import categories
from .auth import login_required
from .helpers import submitQuestion, getQuestions

bp = Blueprint("question_sets", __name__, url_prefix="/question-sets")


@bp.route("/browse")
def browse():
    db = get_db()
    # Select non-temporary question sets with their creators from the database
    question_sets = db.execute(
        """SELECT qs.id, qs.name, u.username AS creator
        FROM question_sets AS qs JOIN users AS u
        ON qs.creator_id = u.id WHERE qs.temporary = 0"""
    ).fetchall()

    private_question_sets = []
    if g.user is not None:
        private_question_sets = db.execute(
            """SELECT id, name, temporary FROM question_sets
            WHERE creator_id = ?""", (g.user["id"],)
        ).fetchall()

    for question_set in question_sets:
        question_set["questions"] = getQuestions(question_set["id"])

    for question_set in private_question_sets:
        question_set["questions"] = getQuestions(question_set["id"])

    return render_template(
        "question-sets/browse.html",
        question_sets=question_sets,
        private_question_sets=private_question_sets
    )


@bp.route("/add", methods=["GET", "POST"])
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
    elif get_db().execute("SELECT 1 FROM question_sets WHERE name = ?",
                          (name,)).fetchone():
        error = "This question set name is already used"

    if error is not None:
        flash(error, "danger")
        return render_template("question-sets/add.html")

    return redirect(url_for(
        "question_sets.add_user_generated",
        name=name, temp=request.form.get("temp")
    ))


@bp.route("/add/user-generated")
@login_required()
def add_user_generated():
    questions = get_db().execute(
        """SELECT q.id, q.category, q.difficulty,
        q.question, u.username AS creator
        FROM questions AS q JOIN users AS u ON u.id = q.creator_id
        WHERE q.source = 'user' AND q.verified = 1"""
    ).fetchall()

    # Replace category numbers with strings
    for question in questions:
        question["category"] = categories[question["category"]]

    return render_template(
        "question-sets/add_user_questions.html", questions=questions
    )


@bp.route("/add/opentdb")
@login_required()
def add_opentdb():
    return render_template("question-sets/add_otdb_questions.html")


@bp.route("/submit", methods=["POST"])
@login_required()
def submit_set():
    request_json = request.get_json()
    name = request_json["name"]
    temp = request_json["temporary"]
    userQuestions = request_json["user_questions"]
    otdbQuestions = request_json["otdb_questions"]

    # Only temporary question sets can have questions
    # from the Open Trivia Database
    if not temp and otdbQuestions:
        flash(
            "Non-temporary question sets can only have user created questions",
            "danger"
        )
        return {"url": url_for("question_sets.add")}

    if len(userQuestions) + len(otdbQuestions) > 50:
        flash(
            "Limit of 50 questions exceeded",
            "danger"
        )
        return {"url": url_for("question_sets.add")}

    if len(userQuestions) + len(otdbQuestions) < 5:
        flash(
            "Not enough questions provided",
            "danger"
        )
        return {"url": url_for("question_sets.add")}

    db = get_db()
    try:
        # Create the question_set entry
        question_set_id = db.execute(
            """INSERT INTO question_sets (name, creator_id, temporary)
                VALUES (?, ?, ?)""", (name, int(g.user["id"]), int(temp))
        ).lastrowid

        # Add otdb questions to the database and
        # connect them to the question_set
        for question in otdbQuestions:
            # See if question already exists in the database
            question_id = db.execute(
                """SELECT id FROM questions WHERE source = ? AND question = ?
                AND type = ? AND category = ? AND difficulty = ?""",
                ("opentdb", question["question"], question["type"],
                 int(question["category"]), question["difficulty"])
            ).fetchone()

            # Add question to DB if it doesn't exist
            if question_id is None:
                question_id, error = submitQuestion(
                    "opentdb", question["type"], None, question["category"],
                    question["difficulty"], question["question"],
                    question["correct_answer"], question["incorrect_answers"]
                )
            else:
                question_id = question_id["id"]

            db.execute(
                """INSERT INTO question_set_questions (question_set_id,
                       question_id) VALUES (?, ?)""",
                (question_set_id, question_id)
            )

        # Connect user questions with the question set
        for question in userQuestions:
            # Don't accept question ids that have not
            # been verified or don't exist
            if not db.execute(
                """SELECT 1 FROM questions WHERE id = ? AND
                source = 'user' AND verified = 1""",
                (question,)
            ).fetchone():
                flash("This question is not verified", "danger")
                return {"url": url_for("question_sets.add")}

            db.execute(
                """INSERT INTO question_set_questions (question_set_id,
                   question_id) VALUES (?, ?)""",
                (question_set_id, question)
            )
        db.commit()

    except (db.IntegrityError, ValueError):
        flash(
            """An unexpected error occured while processing your request,
            please try again later""",
            "danger"
        )
        return {"url": url_for("question_sets.add")}

    flash("Question set successfully created", "success")
    return {"url": url_for("index")}
