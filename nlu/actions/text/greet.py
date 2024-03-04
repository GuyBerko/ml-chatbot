class Greet:
    def __init__(self):
        self.options = {'en': "Hi{}, I'm Lingos, it's nice to meet you!👋\n\n"
                              "Practice your English by speaking with me about anything and I'll provide feedback.\n\n"
                              "What would you like to talk about?",
                        'es': "Hola{}, soy Lingos, ¡encantado de conocerte!👋\n\n"
                              "Practica tu español hablando conmigo sobre cualquier cosa y te proporcionaré comentarios.\n\n"
                              "¿De qué te gustaría hablar?"}

    def get(self, lang, name):
        lang = 'en' if lang is None else lang
        name = ' ' + name if name else ''
        return self.options[lang].format(name)

