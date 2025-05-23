import sqlite3
import click
from flask import current_app, g


def dict_factory(cursor, row):
    keys = [column[0] for column in cursor.description]
    return {key: value for key, value in zip(keys, row)}


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(
            current_app.config["DATABASE"],
            detect_types=sqlite3.PARSE_DECLTYPES
        )

        # Set results to be retrieved as dicts
        g.db.row_factory = dict_factory

    return g.db


# Create database
def init_db():
    db = get_db()
    with current_app.open_resource("schema.sql") as f:
        db.executescript(f.read().decode("utf8"))


def close_connection(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


# CLI for initializing the DB (flask --app smarter init-db)
@click.command("init-db")
def init_db_command():
    init_db()
    click.echo("Initialized the database.")


# Register database functions with the Flask app
def init_app(app):
    app.teardown_appcontext(close_connection)
    app.cli.add_command(init_db_command)
