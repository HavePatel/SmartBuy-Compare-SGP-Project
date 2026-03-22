from flask_sqlalchemy import SQLAlchemy
from authlib.integrations.flask_client import OAuth

# Central place to initialize extensions (app factory will call init_app()).
db = SQLAlchemy()
oauth = OAuth()
