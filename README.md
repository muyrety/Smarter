# Smarter
Web application for playing trivia games using [Flask](https://flask.palletsprojects.com/),
[SQLite](https://www.sqlite.org/index.html) and [Bootstrap](https://getbootstrap.com/).
Users are able to add new questions or use the ones provided by the [OpenTriviaDatabase](https://opentdb.com/).
The server has moderation, so submitted questions must first be reviewed by an admin. You can try out the app on our [flagship instance](https://www.uselis.eu/).

# Building

## Installing a release
This method is recommended if you want to host (deploy) the app.

### 1. Download the wheel file from [GitHub releases](https://github.com/muyrety/Smarter/releases)
```
$ wget https://github.com/muyrety/Smarter/releases/download/VERSION/smarter-VERSION-py3-none-any.whl
```
or just navigate to the releases page and download through a browser.

### 2. Navigate to the directory you downloaded the file to and create a Python virtual environment ([Python](https://www.python.org/downloads/) is required)
Linux/MacOS
```
$ python -m venv .venv 
$ . .venv/bin/activate
```

Windows
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
SECRET_KEY = 'YOUR_GENERATED_VALUE'
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
#### 7.1 Accessible to your computer only
```
$ flask --app smarter run
```
or
```
$ python -m smarter
```
#### 7.2 Accessible to LAN
```
$ flask --app smarter run --host 0.0.0.0
```
You can connect to the website over LAN using the host device's local IPv4 address or hostname and the default port 5000. You can learn how to find out the local IPv4 address of a device [here](https://www.whatismybrowser.com/detect/what-is-my-local-ip-address/). Example URL: http://192.168.1.1:5000/.
> [!WARNING]
> Don't use `flask run` when opening Smarter to the internet. Use a WSGI server like [gunicorn](https://gunicorn.org/) with a web server like [nginx](https://nginx.org/) instead.

## Cloning the repo
This method is recommended if you want to edit the code.
### 1. Clone the GitHub repository ([git](https://git-scm.com/downloads) is required)
```
$ git clone https://github.com/muyrety/Smarter.git
```

### 2. Create a Python virtual environment ([Python](https://www.python.org/downloads/) is required)
Linux/MacOS
```
$ cd Smarter
$ python -m venv .venv 
$ . .venv/bin/activate
```

Windows
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
