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

    isOwner = get_db().execute(
        "SELECT 1 FROM games WHERE uuid = ? AND owner_id = ?",
        (id, g.user["id"])
    ).fetchone()
    if isOwner:
        return render_template('game/show.html', id=id)
    else:
        pass  # TODO: Complete later
        # Need to add the user to players
