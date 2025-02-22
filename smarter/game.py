from flask import (
    Blueprint, render_template, request, flash, redirect, url_for, g
)
from .utility import getQuestionSets, addGame
from .auth import login_required
from .db import get_db

bp = Blueprint("game", __name__)


@bp.route("/")
def index():
    return redirect(url_for("game.join_game"))


@bp.route("/create", methods=['GET', 'POST'])
@login_required()
def create_game():
    question_sets = getQuestionSets()
    if request.method == 'GET':
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True
        )

    id = request.form.get('id')
    if not id:
        flash('No id provided', 'danger')
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True
        )

    # Private question sets are the users own
    if any(str(qs['id']) == id for qs in question_sets["question_sets"] +
       question_sets["private_question_sets"]):
        game_uuid = addGame(id)
        if game_uuid is None:
            flash(
                'An unexpected error occured while adding question',
                'danger'
            )
            return render_template(
                "question-sets/browse.html",
                question_sets=question_sets["question_sets"],
                private_question_sets=question_sets["private_question_sets"],
                for_game=True
            )
        return redirect(url_for('game.join_game', id=game_uuid))
    else:
        flash(
            'This ID does not exist or you are not authorized to use it',
            'danger'
        )
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True
        )


@bp.route("/join")
@bp.route("/join/<id>")
@login_required()
def join_game(id=None):
    if id is None:
        return render_template('game/join.html')

    db = get_db()
    isOwner = db.execute(
        "SELECT 1 FROM games WHERE uuid = ? AND owner_id = ?",
        (id, g.user["id"])
    ).fetchone()
    if isOwner:
        return render_template('game/show.html', id=id)
    else:
        qsName = db.execute(
            """SELECT name FROM question_sets WHERE id =
                (SELECT question_set_id FROM games WHERE uuid = ?)""",
            (id,)
        ).fetchone()
        if qsName is None:
            flash("This game does not exist", "danger")
            return redirect(url_for("game.join_game"))

        qsName = qsName["name"]

        game_id = db.execute(
            "SELECT id FROM games WHERE uuid = ?",
            (id,)
        ).fetchone()["id"]

        players = db.execute(
            """SELECT username FROM users WHERE id IN
                (SELECT player_id FROM players WHERE game_id = ?)""",
            (game_id,)
        ).fetchall()
        players = [row["username"] for row in players]

        owner = db.execute(
            """SELECT username FROM users WHERE id =
                (SELECT owner_id FROM games WHERE id = ?)""",
            (game_id,)
        ).fetchone()["username"]

        # Try to insert user if he is not already in the game
        if g.user["username"] not in players:
            try:
                db.execute(
                    """INSERT INTO players(game_id, player_id) VALUES(?, ?)""",
                    (game_id, g.user["id"])
                )
                db.commit()
                players.append(g.user["username"])
            except db.IntegrityError:
                # TODO: change to something more logical (ongoing game tab)
                flash("You are already in an ongoing game", "danger")
                return redirect(url_for("game.join_game"))

        return render_template(
            "game/pregame.html", qs_name=qsName, players=players, owner=owner
        )
