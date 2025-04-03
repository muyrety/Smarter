DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS games;
DROP TABLE IF EXISTS players;
DROP TABLE IF EXISTS question_sets;
DROP TABLE IF EXISTS question_set_questions;

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    hash TEXT NOT NULL
);

CREATE TABLE questions (
    id INTEGER PRIMARY KEY,
    source TEXT NOT NULL CHECK (source = 'opentdb' OR source = 'user'),
    verified INTEGER DEFAULT 0 CHECK(verified = NULL OR verified = 0 OR verified = 1),
    type TEXT NOT NULL CHECK(type IN ('boolean', 'multiple')),
    creator_id INTEGER,
    category INTEGER NOT NULL CHECK(category >= 9 AND category <= 32),
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
    question TEXT NOT NULL,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);

CREATE TABLE answers (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    correct INTEGER NOT NULL CHECK(correct = 0 OR correct = 1),
    FOREIGN KEY (question_id) REFERENCES questions(id)
);

CREATE TABLE admins (
    user_id INTEGER PRIMARY KEY,
    FOREIGN KEY (user_id) REFERENCES users (id)
);

CREATE TABLE notifications (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    notification TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
); 

CREATE TABLE games (
    id INTEGER PRIMARY KEY,
    uuid TEXT NOT NULL UNIQUE,
    owner_id INTEGER NOT NULL,
    question_set_id INTEGER NOT NULL,
    joinable INTEGER NOT NULL DEFAULT 1 CHECK (joinable = 0 OR joinable = 1),
    current_question INTEGER DEFAULT 1,
    answering INTEGER NOT NULL DEFAULT 0 CHECK (answering = 0 OR answering = 1),
    FOREIGN KEY (owner_id) REFERENCES users (id),
    FOREIGN KEY (question_set_id) REFERENCES question_set (id)
);

CREATE TABLE players (
    game_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL PRIMARY KEY,
    correct_answers INTEGER DEFAULT 0,
    incorrect_answers INTEGER DEFAULT 0,
    FOREIGN KEY (game_id) REFERENCES games (id),
    FOREIGN KEY (player_id) REFERENCES users (id)
);

CREATE TABLE question_sets (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    creator_id INTEGER NOT NULL,
    temporary INTEGER NOT NULL CHECK (temporary = 0 OR temporary = 1),
    FOREIGN KEY (creator_id) REFERENCES users (id)
);

CREATE TABLE question_set_questions (
    question_set_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    PRIMARY KEY (question_set_id, question_id),
    FOREIGN KEY (question_set_id) REFERENCES question_sets (id),
    FOREIGN KEY (question_id) REFERENCES questions (id)
);
