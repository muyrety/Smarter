from .db import get_db
from .constants import categories


# Returns any notifications left for the user and
# removes them from the database
def get_notifications(user_id):
    db = get_db()

    # Get the notifications
    notifications = db.execute(
        "SELECT notification, category FROM notifications WHERE user_id = ?",
        (user_id,)
    ).fetchall()

    # Delete the notifications
    db.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
    db.commit()

    return notifications


def add_notification(user_id, message, category="message"):
    db = get_db()
    db.execute(
        """INSERT INTO notifications (user_id, category, notification)
           VALUES (?, ?, ?)""",
        (user_id, category, message)
    )
    db.commit()


def submitQuestion(source, question_type, creator, category, difficulty,
                   question, correct_answer, incorrect_answers):
    db = get_db()

    if source == "user":
        dupQuestions = db.execute(
            "SELECT 1 FROM questions WHERE question = ? AND source = 'user'",
            (question,)
        ).fetchone()
        if dupQuestions:
            return None, "This question already exists"

    question_id = db.execute(
        """INSERT INTO questions (source, verified, type,
           creator_id, category, difficulty, question)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            source, 0 if source == "user" else None, question_type,
            creator, category, difficulty, question
        )
    ).lastrowid

    # Insert the answers into the database
    db.execute(
        "INSERT INTO answers (question_id, answer, correct) VALUES (?, ?, ?)",
        (question_id, correct_answer, 1)
    )
    if incorrect_answers is not None:
        for answer in incorrect_answers:
            db.execute(
                """INSERT INTO answers (question_id, answer, correct)
                VALUES (?, ?, ?)""",
                (question_id, answer, 0)
            )

    db.commit()
    return question_id, None


def getQuestions(question_set_id):
    db = get_db()
    questions = db.execute(
        """SELECT q.id, q.question, q.difficulty, q.category
            FROM question_set_questions AS qsq
            JOIN questions as q ON qsq.question_id = q.id
            WHERE qsq.question_set_id = ?""",
        (question_set_id,)
    ).fetchall()
    for question in questions:
        question["category"] = categories[question["category"]]

    return questions


def deleteSetQuestions(id):
    db = get_db()

    # Save the questions to delete
    set_questions = db.execute(
        """SELECT question_id FROM question_set_questions
        WHERE question_set_id = ?""", (id,)
    ).fetchall()
    set_questions = [question["question_id"] for question in set_questions]

    # Delete the references to them
    db.execute("""DELETE FROM question_set_questions
               WHERE question_set_id = ?""", (id,)
               )

    # Delete each OpenTDB question that is not featured in any question sets
    for qid in set_questions:
        if db.execute(
            """DELETE FROM questions
            WHERE id = :qid AND source = 'opentdb' AND NOT EXISTS (
                SELECT 1 FROM question_set_questions WHERE question_id = :qid
            )""", {"qid": qid}
        ).rowcount == 1:
            # Only delete answer if question was deleted
            db.execute("DELETE FROM answers WHERE question_id = ?", (qid,))

    db.commit()
