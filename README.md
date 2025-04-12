# Smarter
Web application for playing trivia games using [Flask](https://flask.palletsprojects.com/),
[SQLite](https://www.sqlite.org/index.html), [Bootstrap](https://getbootstrap.com/) and JavaScript.
Users are able to add new questions or use the ones provided by the [OpenTriviaDatabase](https://opentdb.com/).
The server has moderation, so submited questions are first reviewed by an admin.
This project is still under development and many features are not yet implemented.

# Building
## Cloning the repo
This method is recommended if you want to edit the code.
### 1. Clone the GitHub repository ([git](https://git-scm.com/downloads) is required)
```
$ git clone https://github.com/muyrety/Smarter.git
```

### 2. Create a Python virtual environment ([Python](https://www.python.org/downloads/) is required)
#### Linux/MacOS
```
$ cd Smarter
$ python -m venv .venv 
$ . .venv/bin/activate
```

#### Windows
```
> cd Smarter
> python -m venv .venv
> .venv\Scripts\activate
```

### 3. Install the project in development mode
```
$ pip install -e .
```

### 4. Initialize the database
```
$ flask --app smarter init-db
```

### 5. Create an admin account if neccessary
```
$ flask --app smarter add-admin
```
or
```
$ flask --app smarter add-admin --username YOUR_USERNAME --password YOUR_PASSWORD
```

### 6. Run the app
```
$ flask --app smarter run
```
or
```
$ python -m smarter
```

## Installing a release
This method is recommended if you want to host (deploy) the app.

### 1. Download the wheel file from [GitHub releases](https://github.com/muyrety/Smarter/releases)
```
$ wget https://github.com/muyrety/Smarter/releases/download/pre-release/smarter-VERSION-py3-none-any.whl
```
or just navigate to the releases page and download through a browser.

### 2. Navigate to the directory you downloaded the file to and create a Python virtual environment ([Python](https://www.python.org/downloads/) is required)
#### Linux/MacOS
```
$ python -m venv .venv 
$ . .venv/bin/activate
```

#### Windows
```
> python -m venv .venv
> .venv\Scripts\activate
```

### 3. Install the package
```
$ pip install smarter-VERSION-py3-none-any.whl
```

### 4. Initialize the database
```
$ flask --app smarter init-db
```

### 5. Generate and set the SECRET_KEY in .venv/var/smarter-instance/config.py to securely sign the session cookies
```
$ python -c 'import secrets; print(secrets.token_hex())'
YOUR_GENERATED_VALUE
```
```
# .venv/var/smarter-instance/config.py
SECRET_KEY = YOUR_GENERATED_VALUE
```

### 6. Create an admin account if neccessary
```
$ flask --app smarter add-admin
```
or
```
$ flask --app smarter add-admin --username YOUR_USERNAME --password YOUR_PASSWORD
```

### 7. Run the app
```
$ flask --app smarter run
```
or
```
$ python -m smarter
```
