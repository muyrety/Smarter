from flask import (
    Blueprint, render_template, request, flash, redirect, url_for, g
)
from flask_socketio import join_room, emit
from .utility import getQuestionSets, addGame, gameData, getUserGame
from .auth import login_required, load_logged_in_user
from .db import get_db
from .sockets import socketio


@socketio.on("connect", namespace="/join")
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
    joinable = bool(db.execute(
        "SELECT 1 FROM games WHERE uuid = ? AND joinable = 1",
        (uuid,)
    ).fetchone())
    if joinable:
        print("joinable")
        return redirect(url_for("game.join_game", uuid=uuid))
    # TODO:
    return "<h1> In progress, check back later </h1>"


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
