import random
import os
import services.utils as utils
# import services.api as api

from parlai.core.agents import create_agent_from_model_file
from datetime import datetime
from time import sleep
from db.models.BotAgent import BotAgentModel
from config import create_parser

args = create_parser().parse_args()

ENV = os.getenv("ENV")
positive_infinity = float('inf')


class Singleton(type):
    _instances = {}

    def __call__(cls, *args, **kwargs):
        if cls not in cls._instances:
            cls._instances[cls] = super(
                Singleton, cls).__call__(*args, **kwargs)
        return cls._instances[cls]


class ChatBot(metaclass=Singleton):
    def __init__(self, args) -> None:
        self.args = args

        # load model
        if "blenderbot2" in self.args.model_file:
            self.__superAgent = create_agent_from_model_file(
                self.args.model_file, opt_overrides={"search_server": "http://search-server-srv:4002",
                                                     "doc_chunk_split_mode": "word",
                                                     "inference": args.inference,
                                                     "beam_delay": args.beam_delay})
        else:
            self.__superAgent = create_agent_from_model_file(self.args.model_file,
                                                             opt_overrides={"inference": args.inference,
                                                                            "beam_delay": args.beam_delay}
                                                             )

        # initialized agents dict for caching
        self.__agents = {}

        if ENV == "development":
            self.__superAgent.opt.log()

    # function to get the agent by user id
    def get_agent(self, user_id, full_name) -> "Agent":
        # if user already has an agent, get it from the agents dict
        if user_id in self.__agents:
            agent = self.__agents[user_id]
        # if user does not have agent already
        else:
            # get user agent data from db
            # user_data = api.get_user_data(user_id)

            bot_agent = BotAgentModel.find(user_id)

            # create agent
            agent = Agent(
                self.__superAgent,
                user_id,
                full_name,
                self.args.max_interactions_per_subject,
                self.args.openers_path
            )

            # load user data from database
            if bool(bot_agent):
                agent.load_user_data(bot_agent, full_name)
            else:
                BotAgentModel(
                    user_id=user_id,
                    subject_cnt=agent.subject_cnt,
                    max_interactions_per_subject=agent.max_interactions_per_subject,
                    openers=agent.openers,
                    last_user_message_id=agent.last_user_message_id,
                    last_user_message_date=agent.last_user_message_date,
                    last_bot_text_id=agent.last_bot_text_id,
                    last_bot_text_date=agent.last_bot_text_date,
                    last_bot_voice_id=agent.last_bot_voice_id,
                    last_bot_voice_date=agent.last_bot_voice_date,
                    text_history=agent.get_history()
                ).save()

            # add to agents dict
            self.__agents[user_id] = agent

        return agent

    # function for getting all agents
    def get_all_agents(self):
        return self.__agents

    # function for removing agent
    def remove_agent(self, user_id) -> None:
        self.__agents[user_id].reset()
        del self.__agents[user_id]
        print("[ChatBot][removeAgent] - agent for user: {} was removed".format(user_id))


class Agent:
    def __init__(self, superAgent, user_id, full_name, max_interactions_per_subject, openers_path) -> None:
        self.__agent = superAgent.clone()
        self.__user_id = user_id
        self.__full_name = full_name
        self.subject_cnt = 0  # counter for number of interactions from the last subject change
        self.max_interactions_per_subject = max_interactions_per_subject
        self.openers = utils.read_txt_lines(openers_path)

        self.last_user_message_id = 0
        self.last_user_message_date = datetime.now()
        self.last_bot_text_id = 0
        self.last_bot_text_date = datetime.now()
        self.last_bot_voice_id = 0
        self.last_bot_voice_date = datetime.now()

    def update(self):
        BotAgentModel(
            user_id=self.__user_id,
            subject_cnt=self.subject_cnt,
            max_interactions_per_subject=self.max_interactions_per_subject,
            openers=self.openers,
            last_user_message_id=self.last_user_message_id,
            last_user_message_date=self.last_user_message_date,
            last_bot_text_id=self.last_bot_text_id,
            last_bot_text_date=self.last_bot_text_date,
            last_bot_voice_id=self.last_bot_voice_id,
            last_bot_voice_date=self.last_bot_voice_date,
            text_history=self.get_history()
        ).save()

    def reset(self) -> None:
        self.__agent.reset()
        print(
            "[Agent][reset] - the model of user: {} was removed".format(self.__user_id))

    def reset_history(self):
        self.__agent.reset()
        self.last_user_message_id = 0
        self.last_user_message_date = datetime.now().timestamp()
        self.last_bot_text_id = 0
        self.last_bot_text_date = datetime.now().timestamp()
        self.last_bot_voice_id = 0
        self.last_bot_voice_date = datetime.now().timestamp()
        self.subject_cnt = 0

    def get_message(self, input_text) -> str:
        self.__agent.observe({"text": input_text, "episode_done": False})
        while True:
            try:
                msg = self.__agent.act()
                text_msg = self.choose_response(msg)
                break
            except RuntimeError:
                print("* Runtime error for user {} *".format(self.__full_name))
                sleep(1.0)
                continue

        self.subject_cnt += 1

        return text_msg

    def choose_response(self, msg):
        # TODO: uncomment this
        # if args.filter_offensive:
        #    return self.choose_response_with_offensive_check(msg)

        text_msg = msg['text']

        if '?' not in text_msg:  # if no question in original response
            # loop over all beams except for the first one
            for text_beam, _ in msg['beam_texts'][1:]:
                if '?' in text_beam:
                    self.delete_last_sentence()  # delete original response
                    # append new response
                    self.__agent.observe(
                        {"text": text_beam, "episode_done": False})
                    print(
                        "* user: {}, original response: {} *".format(self.__full_name, text_msg))
                    return text_beam

        return text_msg

    def delete_last_sentence(self):
        self.__agent.history.history_raw_strings.pop()
        self.__agent.history.history_strings.pop()
        self.__agent.history.history_vecs.pop()

    def get_self_message(self, input_text):
        self.__agent.self_observe({"text": input_text, "episode_done": False})

    def observe(self, input_text):
        self.__agent.observe({"text": input_text, "episode_done": False})

    # if we saw "max_interactions_per_subject" and user did not ask a question --> change the subject
    def time_for_new_subject(self, input_text):
        if self.subject_cnt >= self.max_interactions_per_subject and "?" not in input_text:
            self.subject_cnt = 0
            return True
        else:
            return False

    # get a new random opener (we assume self.openers_exist was used to make sure there are openers left)
    # TODO: Do we want to repeat openers once we're done with all of them?
    def get_opener(self):
        new_opener = random.choice(self.openers)
        self.openers.remove(new_opener)
        return new_opener

    def openers_exist(self):
        return len(self.openers)

    def set_last_user_message(self, message_id, message_date):
        self.last_user_message_id = message_id
        self.last_user_message_date = message_date

    def last_user_message(self):
        return self.last_user_message_id, self.last_user_message_date

    def set_last_bot_text(self, message_id, message_date):
        self.last_bot_text_id = message_id
        self.last_bot_text_date = message_date

    def last_bot_text(self):
        return self.last_bot_text_id, self.last_bot_text_date

    def set_last_bot_voice(self, message_date):
        # self.last_bot_voice_id = message_id
        self.last_bot_voice_date = message_date

    def last_bot_voice(self):
        return self.last_bot_voice_id, self.last_bot_voice_date

    def delete_last_interaction_history(self):
        # once for bot and once for user
        for _ in range(2):
            self.__agent.history.history_raw_strings.pop()
            self.__agent.history.history_strings.pop()
            self.__agent.history.history_vecs.pop()
        # decrease subject counter by one
        self.subject_cnt = self.subject_cnt - \
            1 if self.subject_cnt > 0 else self.max_interactions_per_subject

    def get_user_data(self):
        user_data = {
            "userId": self.__user_id,
            "fullName": self.__full_name,
            "subjectCount": self.subject_cnt,
            "maxInteractionsPerSubject": self.max_interactions_per_subject,
            "openers": self.openers,
            "lastUserMessageId": self.last_user_message_id,
            "lastUserMessageDate": self.last_user_message_date,
            "lastBotTextId": self.last_bot_text_id,
            "lastBotTextDate": self.last_bot_text_date,
            "lastBotVoiceId": self.last_bot_voice_id,
            "lastBotVoiceDate": self.last_bot_voice_date,
            "history": self.get_history(),
        }

        return user_data

    def get_history(self):
        raw_str = self.__agent.history.get_history_str()
        history_arr = raw_str.split(
            self.__agent.history.delimiter) if raw_str else []
        return history_arr

    def load_user_data(self, user_data, full_name):
        self.__user_id = user_data["user_id"]
        self.__full_name = full_name
        self.subject_cnt = user_data["subject_cnt"]
        self.max_interactions_per_subject = user_data["max_interactions_per_subject"]
        self.openers = user_data["openers"]
        self.last_user_message_id = user_data["last_user_message_id"]
        self.last_user_message_date = user_data["last_user_message_date"]
        self.last_bot_text_id = user_data["last_bot_text_id"]
        self.last_bot_text_date = user_data["last_bot_text_date"]
        self.last_bot_voice_id = user_data["last_bot_voice_id"]
        self.last_bot_voice_date = user_data["last_bot_voice_date"]

        # load history into agent
        self.load_history(user_data["text_history"])

    def load_history(self, history):
        # loop over all messages and let model observe # TODO: check if there's a more efficient way
        for msg in history:
            self.__agent.observe({"text": msg, "episode_done": False})

    ''' TODO: uncomment this
    def choose_response_with_offensive_check(self, msg):
        text_msg = msg['text']

        if '?' in text_msg:
            sentiment_res = api.check_for_offensive_language(text_msg)
            if sentiment_res and sentiment_res["sentiment"] != "negative":
                return text_msg
            else:
                sentiment_res_str = "\n".join("{}\t{}".format(k, v) for k, v in sentiment_res.items())
                print('[choose_response] - found offensive message: {}, offensive res: {}'.format(text_msg, sentiment_res_str))
       
        backup_msg = {
            'text': msg['beam_texts'][1][0],
            'negative': positive_infinity
        }
         # if no question in original response
        for text_beam, _ in msg['beam_texts'][1:]:  # loop over all beams except for the first one
            if '?' in text_beam:
                sentiment_res = api.check_for_offensive_language(text_beam)
                if sentiment_res and sentiment_res["sentiment"] != "negative":
                    self.delete_last_sentence()  # delete original response
                    self.__agent.observe({"text": text_beam, "episode_done": False})  # append new response
                    print("* user: {}, original response: {} *".format(self.__full_name, text_msg))
                    return text_beam
                elif sentiment_res and sentiment_res["probabilities"]["negative"] < backup_msg["negative"]:
                    backup_msg['text'] = text_beam
                    backup_msg['negative'] = sentiment_res["probabilities"]["negative"]
                sentiment_res_str = "\n".join("{}\t{}".format(k, v) for k, v in sentiment_res.items())
                print('[choose_response] - found offensive message: {}, offensive res: {}'.format(text_beam, sentiment_res_str))
        
        return backup_msg["text"]
    '''
