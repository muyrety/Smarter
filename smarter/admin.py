import getpass
import click
from flask import Blueprint, render_template
from werkzeug.security import generate_password_hash
from .db import get_db
from .auth import login_required

bp = Blueprint("admin", __name__, url_prefix="/admin")

@bp.route("/verify-questions")
@login_required(admin=True)
def verify_questions():
    return render_template("admin/verify_questions.html")


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
