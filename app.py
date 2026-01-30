from flask import Flask
from config import Config
import models

def create_app():
    app = Flask(__name__)
    app.secret_key = Config.SECRET_KEY
    
    # Initialize database
    models.init_db()
    
    # Register blueprints
    from blueprints.admin import create_admin_blueprint
    from blueprints.participant import participant_bp
    
    app.register_blueprint(create_admin_blueprint())
    app.register_blueprint(participant_bp)
    
    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
