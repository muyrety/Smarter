# Smarter
Web application for playing trivia games using [Flask][], [SQLite][] and [Bootstrap][]. Users are able
to add new questions or use the ones provided by the [OpenTriviaDatabase][].
The server has moderation, so submited questions are first reviewed by an admin.
This project is still under development and many features are not yet implemented.

[OpenTriviaDatabase]: https://opentdb.com/
[Flask]: https://flask.palletsprojects.com/
[Bootstrap]: https://getbootstrap.com/
[SQLite]: https://www.sqlite.org/index.html

# Building
## Cloning the repo
### 1. Create a python virtual environment and install flask ([Python][] and [pip][] are required)
**Linux/MacOS**
```
$ mkdir Smarter
$ cd Smarter
$ python -m venv .venv 
$ . .venv/bin/activate
$ pip install Flask
```

**Windows**
```
> mkdir Smarter
> cd Smarter
> python -m venv .venv
> .venv\Scripts\activate
> pip install Flask
```

### 2. Clone the github repository ([git][] is required)
```
$ git clone https://github.com/muyrety/Smarter.git
```

### 3. Generate and set the SECRET_KEY in Smarter/instance/config.py to securely sign the session cookies
```
$ python -c 'import secrets; print(secrets.token_hex())'
YOUR_GENERATED_VALUE
```
```
# Smarter/instance/config.py
SECRET_KEY=YOUR_GENERATED_VALUE
```
### 4. Initialize the database
```
$ flask --app smarter init-db
```

### 5. Add any admins if neccessary
```
$ flask --app smarter add-admin
```
or
```
$ flask --app smarter add-admin --username YOUR_USERNAME --password YOUR_PASSWORD
```

### 6. Run the app (for development purposes, for production see [Deploying to Production])
```
$ flask --app smarter run
```

[Python]: https://www.python.org/downloads/
[pip]: https://pip.pypa.io/en/stable/installation/
[git]: https://git-scm.com/downloads
[Deploying to Production]: https://flask.palletsprojects.com/en/3.0.x/deploying/
