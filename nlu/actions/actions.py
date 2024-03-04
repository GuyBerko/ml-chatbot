# This files contains your custom actions which can be used to run
# custom Python code.
#
# See this guide on how to implement these action:
# https://rasa.com/docs/rasa/custom-actions
from typing import Any, Text, Dict, List

from rasa_sdk import Action, Tracker
from rasa_sdk.executor import CollectingDispatcher
from rasa_sdk.events import FollowupAction, SlotSet

import os
import openai

from .utils import get_gpt_response, preprocess_gpt_prompt, content_filter
from .text.greet import Greet
from .text.daily_practice import DailyPractice
from .text.change_topic import ChangeTopic

openai.api_key = os.getenv("OPENAI_API_KEY")

# text holders
greet = Greet()
dailyPractice = DailyPractice()
changeTopic = ChangeTopic()


class ActionRunModel(Action):

    def name(self) -> Text:
        return "action_run_model"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get language
        lang = tracker.get_slot('lang')
        print(lang)

        # get response from GPT
        prompt, num_interactions, prev_response = preprocess_gpt_prompt(tracker.events, lang)
        model = 'text-davinci-002' if num_interactions <= 15 else 'text-curie-001'  # FIXME: temp
        response = get_gpt_response(prompt, user=tracker.sender_id, model=model, prev_response=prev_response, lang=lang)

        # if response is still equal to previous response, ask to change the topic and delete history
        if response == prev_response:
            print('* starting from scratch *')
            return [FollowupAction('action_change_topic_and_ignore_history')]

        # run content filter
        label = content_filter(response)
        if label == "2":  # if content is labeled as unsafe, try to change the subject
            dispatcher.utter_message(text='Would you like to talk about something else?')
            print('original response: {}'.format(response))  # log original response
        else:  # else if content is safe, use original response
            dispatcher.utter_message(text=response)

        return []


class ActionGreetNewUser(Action):

    def name(self) -> Text:
        return "action_greet_new_user"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get language and name
        lang, name = tracker.get_slot('lang'), tracker.get_slot('name')

        # set response
        text = greet.get(lang, name)

        # send
        dispatcher.utter_message(text)

        return []


class ActionChangeTopicAndIgnoreHistory(Action):

    def name(self) -> Text:
        return "action_change_topic_and_ignore_history"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get language
        lang = tracker.get_slot('lang')

        # set response
        text = changeTopic.get(lang)

        # send
        dispatcher.utter_message(text)

        return []


class ActionSetData(Action):
    def name(self) -> Text:
        return "action_set_data"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:
        name = next(tracker.get_latest_entity_values("name"), None)
        lang = next(tracker.get_latest_entity_values("lang"), None)
        return [SlotSet("name", name), SlotSet("lang", lang)]


class ActionGetSuggestedResponse(Action):

    def name(self) -> Text:
        return "action_get_suggested_response"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get language
        lang = tracker.get_slot('lang')

        # get response from GPT
        prompt, num_interactions, prev_response = preprocess_gpt_prompt(tracker.events, lang, lingos_prompt=False)
        response = get_gpt_response(prompt, user=tracker.sender_id,
                                    model='text-curie-001',
                                    prev_response=None,
                                    lang=lang,
                                    nn=1)

        # add prefix
        if lang == 'es':
            response = 'Puedes decir: ' + response
        else:
            response = 'You can say: ' + response

        return [SlotSet("suggested_response", response)]


class ActionDailyPractice(Action):

    def name(self) -> Text:
        return "action_daily_practice"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get language and response index
        lang, idx = tracker.get_slot('lang'), tracker.get_slot('daily_practice_cnt')

        if lang == 'en':
            # set response
            text = dailyPractice.get(idx, lang)

            # send
            dispatcher.utter_message(text)

        return [SlotSet("daily_practice_cnt", idx + 1)]


class ActionChangeLanguage(Action):

    def name(self) -> Text:
        return "action_change_language"

    def run(self, dispatcher: CollectingDispatcher,
            tracker: Tracker,
            domain: Dict[Text, Any]) -> List[Dict[Text, Any]]:

        # get intent
        intent = tracker.latest_message['intent'].get('name')
        lang_requested = 'es' if intent == 'spanish' else 'en'

        # get name
        name = tracker.get_slot('name')

        # set response
        text = greet.get(lang_requested, name)

        # greet user
        dispatcher.utter_message(text)

        # update slot
        return [SlotSet("lang", lang_requested)]
