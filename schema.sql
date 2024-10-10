CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL,
    hash TEXT NOT NULL
);

CREATE TABLE user_questions (
    id INTEGER PRIMARY KEY,
    verified INTEGER DEFAULT 0 NOT NULL CHECK(verified = 0 OR verified = 1),
    type TEXT NOT NULL CHECK(type IN ('boolean', 'multiple')),
    creator_id TEXT NOT NULL,
    category INTEGER NOT NULL CHECK(category >= 9 AND category <= 32),
    difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
    question TEXT NOT NULL
);

CREATE TABLE answers (
    id INTEGER PRIMARY KEY,
    question_id INTEGER NOT NULL,
    answer TEXT NOT NULL,
    correct INTEGER DEFAULT 0 NOT NULL CHECK(correct = 0 OR correct = 1),
    FOREIGN KEY (question_id) REFERENCES user_questions(id)
);
