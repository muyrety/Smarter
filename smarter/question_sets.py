from flask import (
    Blueprint, render_template, request,
    flash, redirect, url_for, g
)
from better_profanity import profanity
from .db import get_db
from .constants import categories
from .auth import login_required
from .helpers import (
    submitQuestion, deleteSetQuestions, getQuestionSets
)

bp = Blueprint("question_sets", __name__, url_prefix="/question-sets")


@bp.route("/browse")
def browse():
    question_sets = getQuestionSets()

    return render_template(
        "question-sets/browse.html",
        question_sets=question_sets["question_sets"],
        private_question_sets=question_sets["private_question_sets"],
        for_game=False
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


@bp.route("/check_question/<int:id>")
@login_required()
def check_question(id):
    return {
        "id_ok": bool(
            get_db().execute(
                """SELECT 1 FROM questions WHERE id = ? AND
               source = 'user' AND verified = 1""",
                (id,)
            ).fetchone()
        )
    }


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
        return {"success": False}

    if len(userQuestions) + len(otdbQuestions) > 50:
        flash(
            "Limit of 50 questions exceeded",
            "danger"
        )
        return {"success": False}

    if len(userQuestions) + len(otdbQuestions) < 5:
        flash(
            "Not enough questions provided",
            "danger"
        )
        return {"success": False}

    db = get_db()
    try:
        # Create the question_set entry
        question_set_id = db.execute(
            """INSERT INTO question_sets (name, creator_id, temporary)
                VALUES (?, ?, ?)""", (name, int(g.user["id"]), int(temp))
        ).lastrowid

        used_ids = []
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

            # Filter duplicate questions
            if question_id not in used_ids:
                db.execute(
                    """INSERT INTO question_set_questions (question_set_id,
                       question_id) VALUES (?, ?)""",
                    (question_set_id, question_id)
                )
            used_ids.append(question_id)

        used_ids.clear()
        # Connect user questions with the question set
        for question in userQuestions:
            # Don't accept question ids that have not
            # been verified or don't exist
            if not db.execute(
                """SELECT 1 FROM questions WHERE id = ? AND
                source = 'user' AND verified = 1""",
                (question,)
            ).fetchone():
                flash(
                    "Some questions are not verified or user-generated",
                    "danger"
                )
                return {"success": False}

            # Filter duplicate questions
            if question not in used_ids:
                db.execute(
                    """INSERT INTO question_set_questions (question_set_id,
                   question_id) VALUES (?, ?)""",
                    (question_set_id, question)
                )
            used_ids.append(question)
        db.commit()

    except (db.IntegrityError, ValueError):
        flash(
            """An unexpected error occured while processing your request,
            please try again later""",
            "danger"
        )
        return {"success": False}

    flash("Question set successfully created", "success")
    return {"success": True}


@bp.route("/remove/<int:id>", methods=["POST"])
@login_required()
def remove(id):
    db = get_db()
    if not db.execute(
        "SELECT 1 FROM question_sets WHERE id = ? AND creator_id = ?",
        (id, g.user["id"])
    ).fetchone():
        flash("You are not permitted to delete this set", "danger")
        return redirect(url_for("question_sets.browse"), 403)

    db.execute("DELETE FROM question_sets WHERE id = ?", (id,))

    deleteSetQuestions(id)

    flash("Question set deleted", "success")
    return redirect(url_for("question_sets.browse"))
