import click
from flask import Blueprint, render_template, redirect, url_for
from werkzeug.security import generate_password_hash

from .db import get_db
from .auth import login_required
from .constants import categories
from .utility import add_notification

bp = Blueprint("admin", __name__, url_prefix="/admin")


@bp.route("/verify-questions")
@login_required(admin=True)
def verify_questions():
    db = get_db()

    # Select unverified questions
    questions = db.execute(
        """SELECT q.id, q.type, q.category, q.difficulty,
        q.question, u.username AS creator FROM questions AS q
        JOIN users AS u ON q.creator_id = u.id
        WHERE q.verified = 0 AND q.source = 'user'"""
    ).fetchall()

    for question in questions:
        # Convert category numbers to strings
        question["category"] = categories[question["category"]]

        # Load answers
        answers = db.execute(
            "SELECT answer, correct FROM answers WHERE question_id = ?",
            (question["id"],)
        ).fetchall()
        question["incorrect_answers"] = []
        for answer in answers:
            if answer["correct"]:
                question["correct_answer"] = answer["answer"]
            else:
                question["incorrect_answers"].append(answer["answer"])

    return render_template("admin/verify_questions.html", questions=questions)


@bp.route("/remove/<int:id>", methods=["POST"])
@login_required(admin=True)
def remove_question(id):
    db = get_db()
    question = db.execute(
        "SELECT question, creator_id FROM questions WHERE id = ?", (id,)
    ).fetchone()
    db.execute(
        "DELETE FROM questions WHERE id = ?", (id,)
    )
    db.execute(
        "DELETE FROM answers WHERE question_id = ?", (id,)
    )
    db.commit()

    add_notification(
        question["creator_id"],
        f'Your question "{question["question"]}" was rejected',
        category="question-rejection"
    )
    return redirect(url_for("admin.verify_questions"))


@bp.route("/accept/<int:id>", methods=["POST"])
@login_required(admin=True)
def accept_question(id):
    db = get_db()
    question = db.execute(
        "SELECT question, creator_id FROM questions WHERE id = ?", (id,)
    ).fetchone()
    db.execute(
        "UPDATE questions SET verified = 1 WHERE id = ?", (id,)
    )
    db.commit()

    add_notification(
        question["creator_id"],
        f'Your question "{question["question"]}" was approved!',
        category="success"
    )
    return redirect(url_for("admin.verify_questions"))


@click.command("add-admin")
@click.option('--username', prompt=True)
@click.password_option(prompt="Password (8+ characters)")
def add_admin_command(username, password):
    if len(password) < 8:
        click.echo("Password is too short")
        return

    # Create user
    db = get_db()
    try:
        user_id = db.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?)",
            (username, generate_password_hash(password))
        ).lastrowid
        db.commit()
    except db.IntegrityError:
        click.echo("Username already taken")
        return

    # Add the user to the admin list
    db.execute("INSERT INTO admins (user_id) VALUES (?)", (user_id,))
    db.commit()

    click.echo("Admin successfully added")


def init_app(app):
    app.cli.add_command(add_admin_command)
