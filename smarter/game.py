from flask import (
    Blueprint, render_template, request, flash, redirect, url_for, g
)
from flask_socketio import join_room, emit

from .utility import getQuestionSets, addGame, gameData, getUserGame
from .auth import login_required, load_logged_in_user
from .db import get_db
from .sockets import socketio


@socketio.on("connect")
def player_joined(data):
    # Manually register user since before_app_request
    # doesn't work with socketIO
    load_logged_in_user()

    db = get_db()

    # Get game id if user is the owner
    game_id = db.execute(
        "SELECT id FROM games WHERE owner_id = ?",
        (g.user["id"],)
    ).fetchone()

    if game_id is None:
        # If it fails, get game id from players table
        game_id = db.execute(
            "SELECT game_id AS id FROM players WHERE player_id = ?",
            (g.user["id"],)
        ).fetchone()
        join_room(game_id["id"])
        emit(
            "user_connected", {"username": g.user["username"]},
            to=game_id["id"], include_self=False
        )
    else:
        # Don't send any events if owner (re)joined
        join_room(game_id["id"])


@socketio.on("delete_game")
def delete_game():
    # Manually register user since before_app_request
    # doesn't work with socketIO
    load_logged_in_user()

    db = get_db()
    game_id = db.execute(
        "SELECT id FROM games WHERE owner_id = ?",
        (g.user["id"],)
    ).fetchone()

    game_id = game_id["id"]
    db.execute("DELETE FROM games WHERE id = ?", (game_id,))
    db.execute("DELETE FROM players WHERE game_id = ?", (game_id,))
    db.commit()
    emit(
        "game_deleted", to=game_id, include_self=False
    )


@socketio.on("leave_game")
def leave_game():
    # Manually register user since before_app_request
    # doesn't work with socketIO
    load_logged_in_user()

    # Get game_id (for room) and delete player from players
    db = get_db()
    game_id = db.execute(
        "SELECT game_id FROM players WHERE player_id = ?",
        (g.user["id"],)
    ).fetchone()
    game_id = game_id["game_id"]
    db.execute("DELETE FROM players WHERE player_id = ?", (g.user["id"],))
    db.commit()

    emit(
        "player_left", {"username": g.user["username"]},
        to=game_id, include_self=False
    )


@socketio.on("start_game")
def start_game():
    load_logged_in_user()
    db = get_db()
    game_data = db.execute(
        "SELECT id, uuid FROM games WHERE owner_id = ?",
        (g.user["id"],)
    ).fetchone()
    has_players = bool(
        db.execute(
            "SELECT 1 FROM players WHERE game_id = ?",
            (game_data["id"],)
        ).fetchone()
    )

    if has_players:
        db.execute(
            "UPDATE games SET joinable = 0 WHERE id = ?", (game_data["id"],)
        )
        db.commit()
        url = url_for("game.play_game", uuid=game_data["uuid"])
        emit(
            "game_started",
            {"url": url},
            to=game_data["id"], include_self=False
        )
        return {"ok": True, "url": url}
    return {"ok": False, "error": "No players joined"}


bp = Blueprint("game", __name__)


@bp.route("/create", methods=['GET', 'POST'])
@login_required()
def create_game():
    question_sets = getQuestionSets()
    game = getUserGame(g.user["id"])
    if request.method == 'GET':
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True, game=game
        )

    id = request.form.get('id')
    if not id:
        flash('No id provided', 'danger')
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True, game=game
        )

    # Private question sets are the users own
    if any(str(qs['id']) == id for qs in question_sets["question_sets"] +
       question_sets["private_question_sets"]):
        game_uuid = addGame(id)
        if game_uuid is None:
            flash(
                'You are in an ongoing game',
                'danger'
            )
            return render_template(
                "question-sets/browse.html",
                question_sets=question_sets["question_sets"],
                private_question_sets=question_sets["private_question_sets"],
                for_game=True, game=game
            )
        return redirect(url_for('game.join_game', uuid=game_uuid))
    else:
        flash(
            'This ID does not exist or you are not authorized to use it',
            'danger'
        )
        return render_template(
            "question-sets/browse.html",
            question_sets=question_sets["question_sets"],
            private_question_sets=question_sets["private_question_sets"],
            for_game=True, game=game
        )


@bp.route("/play")
@bp.route("/play/<uuid>")
@login_required()
def play_game(uuid=None):
    if uuid is None:
        flash("No UUID supplied, try joining game instead", "danger")
        return redirect(url_for("game.join_game"))

    db = get_db()
    id = db.execute(
        "SELECT id FROM games WHERE uuid = ?", (uuid,)
    ).fetchone()

    if id is None:
        flash("Invalid UUID supplied, try joining game instead", "danger")
        return redirect(url_for("game.join_game"))
    id = id["id"]

    joinable = bool(db.execute(
        "SELECT 1 FROM games WHERE uuid = ? AND joinable = 1",
        (uuid,)
    ).fetchone())
    if joinable:
        return redirect(url_for("game.join_game", uuid=uuid))

    game_data = db.execute(
        """SELECT question_set_id, owner_id, current_question, answering
        FROM games WHERE id = ?""",
        (id,)
    ).fetchone()
    qs_id = game_data["question_set_id"]
    owner_id = game_data["owner_id"]
    current_question = game_data["current_question"]
    answering = bool(game_data["answering"])

    total = db.execute(
        """SELECT COUNT(*) AS total FROM questions WHERE id IN (
              SELECT question_id FROM question_set_questions WHERE
              question_set_id = ?
            )""",
        (qs_id,)
    ).fetchone()["total"]
    qs_name = db.execute(
        "SELECT name FROM question_sets WHERE id = ?",
        (qs_id,)
    ).fetchone()["name"]

    if owner_id == g.user["id"]:
        leaderboard = db.execute("""
            SELECT username, correct_answers, incorrect_answers
            FROM players JOIN users ON id = player_id
            WHERE game_id = ? ORDER BY correct_answers DESC
            """, (id,)
        ).fetchall()
        question = db.execute(
            """SELECT question FROM questions WHERE id IN (
                SELECT question_id FROM question_set_questions
                WHERE question_set_id = ?
                ) ORDER BY id LIMIT ?""",
            (qs_id, current_question)
        ).fetchall()[-1]["question"]

        if answering:
            for player in leaderboard:
                player["answered"] = (
                    player["correct_answers"] +
                    player["incorrect_answers"] == current_question
                )

            return render_template(
                "game/owner_view.html", total=total,
                name=qs_name, leaderboard=leaderboard,
                curr_question=current_question, question=question,
                answering=answering
            )
        else:
            return render_template(
                "game/owner_view.html", total=total,
                name=qs_name, leaderboard=leaderboard,
                curr_question=current_question,
                question=question, answering=answering
            )
    else:
        if answering:
            return render_template(
                "game/play.html", total=total,
                name=qs_name, curr_question=current_question,
                answering=answering
            )
        else:
            question = db.execute(
                """SELECT question FROM questions WHERE id IN (
                SELECT question_id FROM question_set_questions
                WHERE question_set_id = ?
                ) ORDER BY id LIMIT ?""",
                (qs_id, current_question)
            ).fetchall()[-1]["question"]
            return render_template(
                "game/play.html", total=total,
                name=qs_name, curr_question=current_question,
                question=question, answering=answering
            )


@bp.route("/join")
@bp.route("/join/<uuid>")
@login_required()
def join_game(uuid=None):
    if uuid is None:
        game = getUserGame(g.user["id"])
        return render_template('game/join.html', game=game)

    db = get_db()
    isOwner = db.execute(
        "SELECT 1 FROM games WHERE uuid = ? AND owner_id = ?",
        (uuid, g.user["id"])
    ).fetchone()
    game_data = gameData(uuid)
    if isOwner:
        if game_data["joinable"]:
            return render_template(
                'game/show.html', id=uuid, players=game_data["players"]
            )
        else:
            return redirect(url_for("game.play_game", uuid=uuid))
    else:
        if game_data["qs_name"] is None:
            flash(
                "This game does not exist",
                "danger"
            )
            return redirect(url_for("game.join_game"))

        inOtherGame = (
            db.execute(
                "SELECT 1 FROM players WHERE player_id = ? AND game_id != ?",
                (g.user["id"], game_data["id"])
            ).fetchone()
            or
            db.execute(
                "SELECT 1 FROM games WHERE owner_id = ? AND id != ?",
                (g.user["id"], game_data["id"])
            ).fetchone()
        )
        # Try to insert user if he is not already in a game
        if inOtherGame:
            flash("You are already in an ongoing game", "danger")
            return redirect(url_for("game.join_game"))
        elif g.user["username"] not in game_data["players"]:
            # Join the player
            if game_data["joinable"]:
                db.execute(
                    """INSERT INTO players(game_id, player_id) VALUES(?, ?)""",
                    (game_data["id"], g.user["id"])
                )
                db.commit()
                game_data["players"].append(g.user["username"])
            # Reject the player
            else:
                flash(
                    "This game is not joinable anymore",
                    "danger"
                )
                return redirect(url_for("game.join_game"))
        # Player is in player list, but the game is not joinable
        # (i. e. in progress), redirect to play game
        elif not game_data["joinable"]:
            return redirect(url_for("game.play_game", uuid=uuid))

        return render_template(
            "game/pregame.html", qs_name=game_data["qs_name"],
            players=game_data["players"], owner=game_data["owner"]
        )
