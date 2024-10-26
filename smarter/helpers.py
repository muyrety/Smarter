from .db import get_db

# Returns any notifications left for the user and removes them from the database
def get_notifications(user_id):
    db = get_db()

    # Get the notifications
    notifications = db.execute(
        "SELECT notification, category FROM notifications WHERE user_id = ?", (user_id,)
    ).fetchall()

    # Delete the notifications
    db.execute("DELETE FROM notifications WHERE user_id = ?", (user_id,))
    db.commit()

    for notification in notifications:
        if not notification["category"]:
            notification["category"] = "message"

    return notifications

def add_notification(user_id, message, category=None):
    db = get_db()
    db.execute(
        "INSERT INTO notifications (user_id, category, notification) VALUES (?, ?, ?)",
        (user_id, category, message)
    )
    db.commit()
