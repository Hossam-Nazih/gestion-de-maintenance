# app.py (main application file)
from flask import Flask
from extensions import db, jwt
from routes.demandeur_routes import demandeur_bp
from routes.auth_routes import auth_bp
from routes.technicien_routes import technicien_bp
from flask_cors import CORS
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')
    
    CORS(app)
    db.init_app(app)
    jwt.init_app(app)
    
    app.register_blueprint(demandeur_bp, url_prefix='/api/demandeur')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(technicien_bp, url_prefix='/api/technicien')
    
    return app

# This is important for flask run to work
app = create_app()

if __name__ == '__main__':
    app.run(debug=True)

# config.py
import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-key'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'mysql+pymysql://root:root@localhost:3306/gmao_carriprefa'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-string'

# extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager

db = SQLAlchemy()
jwt = JWTManager()