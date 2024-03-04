from pymongo import MongoClient
from db.models.BotAgent import BotAgentModel
import os

#mongodb_connection_string = "mongodb://127.0.0.1:27017/chatbot" #os.getenv("MONGO_URI")
mongodb_connection_string = os.getenv("MONGO_URI")

# connect to MongoDB, change the << MONGODB URL >> to reflect your own connection string
client = MongoClient(mongodb_connection_string)

db=client.chatbot

def init():
    collections = db.list_collection_names()
    if 'BotAgent' not in collections:
        BotAgentModel.create_collection()