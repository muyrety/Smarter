from flask import Blueprint, render_template
from .helpers import getQuestionSets
from .auth import login_required

bp = Blueprint("game", __name__)


@bp.route("/create")
@login_required()
def create_game():
    question_sets = getQuestionSets()

    return render_template(
        "question-sets/browse.html",
        question_sets=question_sets["question_sets"],
        private_question_sets=question_sets["private_question_sets"],
        for_game=True
    )
