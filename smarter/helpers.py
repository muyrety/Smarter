from .db import get_db


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
