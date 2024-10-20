import click
from flask import Blueprint, render_template, request, g
from werkzeug.security import generate_password_hash
from .db import get_db
from .auth import login_required

bp = Blueprint("admin", __name__, url_prefix="/admin")

@bp.route("/verify-questions", methods=["GET", "POST"])
@login_required(admin=True)
def verify_questions():
    if request.method == "GET":
        db = get_db()

        # Select unverified questions
        questions = db.execute(
            '''SELECT q.id, q.type, q.category, q.difficulty, q.question, u.username AS creator
            FROM user_questions AS q JOIN users AS u ON q.creator_id = u.id WHERE q.verified = 0'''
        ).fetchall()

        for question in questions:
            # Convert category numbers to strings
            question["category"] = g.categories[question["category"]]

            # Load answers
            answers = db.execute(
                "SELECT answer, correct FROM answers WHERE question_id = ?", (question["id"],)
            ).fetchall()
            question["incorrect_answers"] = []
            for answer in answers:
                if answer["correct"]:
                    question["correct_answer"] = answer["answer"]
                else:
                    question["incorrect_answers"].append(answer["answer"])

        return render_template("admin/verify_questions.html", questions=questions)


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
