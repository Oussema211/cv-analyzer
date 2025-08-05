import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/cv_database")
    SECRET_KEY = os.getenv("SECRET_KEY", "e1c8f1a947d8f3a8dcd85957e40f4ae183a7c9aab83c947f3aa78f3cd8927b5c")