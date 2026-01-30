import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    DATABASE_PATH = os.environ.get('DATABASE_PATH', 'database.db')
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
    ADMIN_URL_SECRET = os.environ.get('ADMIN_URL_SECRET', '7x9k2m')
