from operator import itemgetter
from flask import (
    Blueprint, render_template, request, flash, redirect, url_for, g
)
from flask_socketio import join_room, leave_room, close_room, emit

from .utility import (
    getQuestionSets, addGame, gameData, getUserGame, deleteSetQuestions
)
from .auth import login_required, load_logged_in_user
from .db import get_db
from .sockets import socketio


@socketio.on("connect")
def player_joined(data=None):
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
        if game_id is not None:
            join_room(game_id["id"])
            emit(
                "user_connected", {"username": g.user["username"]},
                to=game_id["id"], include_self=False
            )
    else:
        # Don't send any events if owner (re)joined
        join_room(game_id["id"])

        # Create a room with just the owner for easy forwarding
        join_room(f"{game_id['id']}_owner")


@socketio.on("delete_game")
def delete_game():
    # Manually register user since before_app_request
    # doesn't work with socketIO
    load_logged_in_user()

    db = get_db()
    game_data = db.execute(
        "SELECT id, question_set_id FROM games WHERE owner_id = ?",
        (g.user["id"],)
    ).fetchone()

    if game_data is not None:
        game_id = game_data["id"]
        question_set_id = game_data["question_set_id"]
        temp = bool(db.execute(
            "SELECT 1 FROM question_sets WHERE id = ? AND temporary = 1",
            (question_set_id,)
        ).fetchone())
        if temp:
            db.execute("DELETE FROM question_sets WHERE id = ?",
                       (question_set_id,))
            deleteSetQuestions(question_set_id)

        db.execute("DELETE FROM games WHERE id = ?", (game_id,))
        db.execute("DELETE FROM players WHERE game_id = ?", (game_id,))
        db.commit()
        emit(
            "game_deleted", to=game_id, include_self=False
        )
        close_room(game_id)
        close_room(f"{game_id}_owner")


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
    if game_id is not None:
        game_id = game_id["game_id"]
        db.execute("DELETE FROM players WHERE player_id = ?", (g.user["id"],))
        db.commit()

        emit(
            "player_left", {"username": g.user["username"]},
            to=game_id, include_self=False
        )
        leave_room(game_id)


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


@socketio.on("load_next_question")
def load_next_question():
    load_logged_in_user()

    # Get game data
    db = get_db()
    game_data = db.execute(
        """SELECT id, question_set_id, current_question, answering
        FROM games WHERE owner_id = ?""",
        (g.user["id"],)
    ).fetchone()
    if game_data is None or bool(game_data["answering"]):
        return None

    qs_id = game_data["question_set_id"]
    current_question = game_data["current_question"]
    game_id = game_data["id"]

    # Get next question
    question_data = db.execute(
        """SELECT id, question FROM questions WHERE id IN (
            SELECT question_id FROM question_set_questions
            WHERE question_set_id = ?
            ) ORDER BY id LIMIT ?""",
        (qs_id, current_question)
    ).fetchall()[-1]
    question = question_data["question"]

    # Get question answers
    # Sort by id since the client sends back the index of the answer,
    # not the answer itself
    answers = db.execute(
        "SELECT answer FROM answers WHERE question_id = ? ORDER BY id",
        (question_data["id"],)
    ).fetchall()
    answers = [d["answer"] for d in answers]

    # Always send boolean answers as True first and False second
    if len(answers) == 2:
        answers = ["True", "False"]

    # Trigger answering flag
    db.execute(
        "UPDATE games SET answering = 1 WHERE owner_id = ?",
        (g.user["id"],)
    )
    db.commit()

    # Send event to game id room with next question and answers
    emit(
        "answering_started",
        {"question": question, "answers": answers},
        to=game_id, include_self=False
    )

    return question


@socketio.on("answered")
def check_answer(answerIdx):
    load_logged_in_user()

    db = get_db()
    game_data = db.execute(
        """SELECT id, question_set_id, answering, current_question
        FROM games WHERE id = (
            SELECT game_id FROM players WHERE player_id = ?
        )""",
        (g.user["id"],)
    ).fetchone()

    answer_sum = db.execute(
        """SELECT correct_answers + incorrect_answers AS sum
        FROM players WHERE player_id = ?""",
        (g.user["id"],)
    ).fetchone()

    if (game_data is None or not bool(game_data["answering"]) or
            answer_sum["sum"] >= game_data["current_question"]):
        return

    question_id = db.execute(
        """SELECT question_id FROM question_set_questions
        WHERE question_set_id = ? ORDER BY question_id LIMIT ?""",
        (game_data["question_set_id"], game_data["current_question"],)
    ).fetchall()[-1]["question_id"]

    answers = db.execute(
        "SELECT answer, correct FROM answers WHERE question_id = ?",
        (question_id,)
    ).fetchall()

    # Always send boolean answers as True first and False second
    if len(answers) == 2:
        answers = (
            answers if answers[0]["answer"] == "True"
            else list(reversed(answers))
        )
    correct = bool(answers[answerIdx]["correct"])

    if correct:
        db.execute(
            """UPDATE players SET correct_answers = correct_answers + 1
            WHERE player_id = ?""",
            (g.user["id"],)
        )
    else:
        db.execute(
            """UPDATE players SET incorrect_answers = incorrect_answers + 1
            WHERE player_id = ?""",
            (g.user["id"],)
        )
    db.commit()

    emit(
        "player_answered",
        (g.user["username"], correct,),
        to=f"{game_data['id']}_owner"
    )


@socketio.on("stop_answering")
def stop_answering():
    """Emit and return progress and new question.
    Internally: switch answering to 0, increment current_question.
    Count any missing answers from players as incorrect.
    Redirect to results page when last question is answered"""

    load_logged_in_user()

    db = get_db()
    game_data = db.execute(
        """SELECT id, question_set_id, current_question, answering
        FROM games WHERE owner_id = ?""",
        (g.user["id"],)
    ).fetchone()
    if not game_data or not bool(game_data["answering"]):
        return None

    qs_id = game_data["question_set_id"]
    current_question = game_data["current_question"]

    # Count any missing answers as incorrect
    db.execute(
        """UPDATE players SET incorrect_answers = ? - correct_answers
        WHERE game_id = ?""",
        (current_question, game_data["id"],)
    )
    db.commit()

    # Update current_question to one out-of-bounds to be able to
    # differentiate between an over game and an ongoing one
    db.execute(
        "UPDATE games SET answering = 0, current_question = ? WHERE id = ?",
        (current_question + 1, game_data["id"],)
    )
    db.commit()

    questions = db.execute(
        """SELECT question FROM questions WHERE id IN (
                SELECT question_id FROM question_set_questions
                WHERE question_set_id = ?
                ) ORDER BY id LIMIT ?""",
        (qs_id, current_question + 1,)
    ).fetchall()

    if len(questions) <= current_question:
        uuid = db.execute(
            "SELECT uuid FROM games WHERE id = ?",
            (game_data["id"],)
        ).fetchone()["uuid"]

        emit(
            "answering_ended",
            {"gameOver": True, "url": url_for("game.load_results", uuid=uuid)},
            to=game_data["id"], include_self=False
        )
        return {
            "gameOver": True, "url": url_for("game.load_results", uuid=uuid)
        }

    question = questions[-1]["question"]

    emit(
        "answering_ended",
        {"gameOver": False, "question": question,
            "currQuestionNr": current_question + 1},
        to=game_data["id"], include_self=False
    )
    return {
        "gameOver": False, "progressNr": current_question + 1,
        "question": question
    }


bp = Blueprint("game", __name__)


@bp.route("/results/<uuid>")
@login_required()
def load_results(uuid):
    db = get_db()
    game_data = db.execute(
        "SELECT question_set_id, owner_id, id FROM games WHERE uuid = ?",
        (uuid,)
    ).fetchone()
    if game_data is None:
        flash("This game does not exist or has been deleted", "danger")
        return redirect(url_for("index"))

    name = db.execute(
        "SELECT name FROM question_sets WHERE id = ?",
        (game_data["question_set_id"],)
    ).fetchone()["name"]

    total = db.execute(
        """SELECT COUNT(*) AS total FROM question_set_questions
        WHERE question_set_id = ?""",
        (game_data["question_set_id"],)
    ).fetchone()["total"]

    owner = db.execute(
        "SELECT username FROM users WHERE id = ?",
        (game_data["owner_id"],)
    ).fetchone()["username"]

    players = db.execute(
        """SELECT username, correct_answers FROM players
        JOIN users ON players.player_id = users.id WHERE game_id = ?""",
        (game_data["id"],)
    ).fetchall()
    players.sort(key=itemgetter("correct_answers"), reverse=True)

    is_owner = game_data["owner_id"] == g.user["id"]
    return render_template(
        "game/results.html", name=name, is_owner=is_owner,
        total=total, owner=owner, players=players
    )


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

    is_player = bool(db.execute(
        "SELECT 1 FROM players WHERE player_id = ? AND game_id = ?",
        (g.user["id"], id,)
    ).fetchone())
    if not is_player and g.user["id"] != owner_id:
        flash("You are not part of this game", "danger")
        return redirect(url_for("game.join_game"))

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

    if current_question > total:
        return redirect(url_for("game.load_results", uuid=uuid))

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
        has_answered = False
        if answering:
            answers = db.execute(
                """SELECT correct_answers, incorrect_answers FROM players
            WHERE player_id = ?""", (g.user["id"],)
            ).fetchone()
            has_answered = (
                answers["correct_answers"] +
                answers["incorrect_answers"] ==
                current_question
            )
            return render_template(
                "game/play.html", total=total,
                name=qs_name, curr_question=current_question,
                answering=answering, has_answered=has_answered
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
                question=question, answering=answering,
                has_answered=has_answered
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
