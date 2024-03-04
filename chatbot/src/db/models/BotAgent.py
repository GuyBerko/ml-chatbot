from pymongo import MongoClient
import os
from datetime import datetime

mongodb_connection_string = os.getenv("MONGO_URI")

# connect to MongoDB, change the << MONGODB URL >> to reflect your own connection string
client = MongoClient(mongodb_connection_string)

db=client.chatbot

class BotAgentModel():
    def __init__(self,
                 user_id,
                 subject_cnt,
                 max_interactions_per_subject,
                 openers,
                 last_user_message_id,
                 last_user_message_date,
                 last_bot_text_id,
                 last_bot_text_date,
                 last_bot_voice_id,
                 last_bot_voice_date,
                 text_history) -> None:
        self.user_id = user_id
        self.subject_cnt = subject_cnt
        self.max_interactions_per_subject = max_interactions_per_subject
        self.openers = openers
        self.last_user_message_id = last_user_message_id
        self.last_user_message_date = last_user_message_date
        self.last_bot_text_id = last_bot_text_id
        self.last_bot_text_date = last_bot_text_date
        self.last_bot_voice_id = last_bot_voice_id
        self.last_bot_voice_date = last_bot_voice_date
        self.text_history = text_history

    def save(self):
        filter = {
            'userId': self.user_id
        }

        data = {
            'userId': self.user_id,
            'subjectCount': self.subject_cnt,
            'maxInteractionsPerSubject': self.max_interactions_per_subject,
            'lastUserMessageId': self.last_user_message_id,
            'lastBotTextId': self.last_bot_text_id,
            'lastBotVoiceId': self.last_bot_voice_id,
            'openers': self.openers,
            'lastUserMessageDate': self.last_user_message_date.timestamp(),
            'lastBotTextDate': self.last_bot_text_date.timestamp(),
            'lastBotVoiceDate': self.last_bot_voice_date.timestamp(),
            'textHistory': self.text_history,
        }

        db.BotAgent.replace_one(filter=filter, replacement=data, upsert=True)

    @staticmethod
    def find(user_id):
        bot_agent = db.BotAgent.find_one({'userId': user_id})

        if not bot_agent:
            return False

        return {
            'user_id': bot_agent['userId'],
            'subject_cnt': bot_agent['subjectCount'],
            'max_interactions_per_subject': bot_agent['maxInteractionsPerSubject'],
            'last_user_message_id': bot_agent['lastUserMessageId'],
            'last_bot_text_id': bot_agent['lastBotTextId'],
            'last_bot_voice_id': bot_agent['lastBotVoiceId'],
            'openers': bot_agent['openers'],
            'last_user_message_date': datetime.fromtimestamp(bot_agent['lastUserMessageDate']),
            'last_bot_text_date': datetime.fromtimestamp(bot_agent['lastBotTextDate']),
            'last_bot_voice_date': datetime.fromtimestamp(bot_agent['lastBotVoiceDate']),
            'text_history': bot_agent['textHistory'],
        }

    @staticmethod
    def create_collection():
        db.create_collection('BotAgent', validator={
            '$jsonSchema': {
                'bsonType': 'object',
                'additionalProperties': True,
                'required': ['userId'],
                'properties': {
                    'subjectCount': {
                        'bsonType': 'number',
                    },
                    'maxInteractionsPerSubject': {
                        'bsonType': 'number',
                    },
                    'openers': {
                        'bsonType': 'array',
                    },
                    'lastUserMessageDate': {
                        'bsonType': 'number',
                    },
                    'lastBotTextDate': {
                        'bsonType': 'number',
                    },
                    'lastBotVoiceDate': {
                        'bsonType': 'number',
                    },
                    'textHistory': {
                        'bsonType': 'array',
                    },
                }
            }
        })
