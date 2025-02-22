from .sockets import socketio
from .__init__ import app
socketio.run(app, debug=True)
