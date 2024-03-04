import random


class ChangeTopic:
    def __init__(self):
        self.options = {'en': ["Cambiemos un poco el tema. ¿Qué te gustaría hablar?",
                               "Cambiémoslo un poco. ¿Hay algo más de lo que te gustaría hablar?",
                               "Muy bien, ¿hay algo más de lo que te gustaría hablar?",
                               "Bien, ¿de qué más podemos hablar?",
                               "Bueno. ¿De qué más te gustaría hablar?"
                               ],
                        'es': ["Let's change the topic a bit. What would you like to talk about?",
                               "Let's change it up a bit. Is there anything else you would like to talk about?",
                               "Alright, is there anything else you would like to talk about?",
                               "OK, what else can we talk about?",
                               "Okay. What else would you like to talk about?"]}

    def get(self, lang):
        lang = 'en' if lang is None else lang
        return random.choice(self.options[lang])
