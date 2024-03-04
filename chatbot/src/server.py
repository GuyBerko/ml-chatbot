from flask import Flask, request, Response
from config import create_parser
from services.ChatBot import ChatBot
from db.manager import init
import os
from datetime import datetime, timedelta
import logging

port = os.getenv("PORT") or 4000
host = os.getenv("HOST") or '0.0.0.0'
max_inactive = os.getenv("MAX_INACTIVE") or 3600 #parseInt

args = create_parser().parse_args()
chatBot = ChatBot(args)
app = Flask("chatbot")

log = logging.getLogger('werkzeug')
log.setLevel(logging.ERROR)

@app.route("/message", methods=["POST"])
def create_new_message():
    data = request.get_json()

    # Getting the data from the request
    input_text = data['messageText']
    full_name = data['fullName']
    user_id = data['userId']
    user_message_id = data['messageId']
    user_message_date = datetime.now()
    with_edit = data.get('withEdit') or False

    # Getting the agent for the user
    agent = chatBot.get_agent(user_id, full_name)

    # Check if there is already message in queue
    # if so return error
    if is_in_processing(agent, user_message_date):
        print("last_bot_voice_date: {}, last_user_message_date: {}, user_message_date: {}, last_user_message_date: {}".format(
            agent.last_bot_voice_date.timestamp(), 
            agent.last_user_message_date.timestamp(),
            user_message_date.timestamp(),
            agent.last_user_message_date.timestamp()
            ))
        return get_response({
            "errorKey": "IN_PROCESS",
            "errorDescription": "Message is all ready in process"
        }, 425)

    if with_edit and user_message_id == agent.last_user_message_id:
        # delete last interaction (user+bot messages) from agent history
        agent.delete_last_interaction_history()
        # save current message id
        agent.set_last_user_message(user_message_id, user_message_date)
    elif with_edit:
        return get_response({
            "errorKey": "NOT_LAST_MESSAGE_EDIT",
            "errorDescription": "You can only edit your last message.."
        }, 403)

    # getting bot replay
    bot_reply = agent.get_message(input_text=input_text)

    # TODO: Check for abusive message

    # Update the agent
    agent.set_last_bot_voice(datetime.now())
    agent.set_last_user_message(user_message_id, user_message_date)
    agent.update()

    return bot_reply

@app.route("/cleanup", methods=["GET"])
def cleanup():
    all_agents = chatBot.get_all_agents()
    for user_id in list(all_agents.keys()):
        is_inactive = datetime.now().timestamp() > all_agents[user_id].last_user_message_date.timestamp() + max_inactive
        if is_inactive:
            all_agents[user_id].reset()
            
    return get_response("OK", 200, 'text/plain')

@app.route("/ready", methods=["GET"])
def ready():
    return get_response("OK", 200, 'text/plain')

@app.route("/live", methods=["GET"])
def live():
    return get_response("OK", 200, 'text/plain')

def is_in_processing(agent, user_message_date):
    return (
        agent.last_bot_voice_date.timestamp() < agent.last_user_message_date.timestamp() and 
        (user_message_date.timestamp() - agent.last_user_message_date.timestamp() < 60) 
    )

def get_response(data, status = 200, mimetype = 'application/json'):
    return Response(response=data, status=status, mimetype=mimetype)

if __name__ == '__main__':
    init()
    app.run(host=host, port=port)
    