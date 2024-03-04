class DailyPractice:
    def __init__(self):
        self.options = {'en': [
            "The daily practice ⏰: Ordering at a restaurant.\n\n"
            "In today's practice, you will be a customer, and I will be a waiter at an Italian restaurant.\n\n"
            "Start by saying hi 👋",
            "The daily practice ⏰: Room reservation.\n\n"
            "In today's practice, I will be a receptionist at the Hilton hotel in New York, "
            "and you are making a reservation over the phone.\n\n"
            "Start by saying hello 👋",
            "The daily practice ⏰: Job interview.\n\n"
            "In today's practice, I'm the owner of a Chinese restaurant, "
            "and I'm interviewing you for a job as a chef.\n\n"
            "Start by saying hi 👋",
            "The daily practice ⏰: Taking a taxi.\n\n"
            "In today's practice, I'm a taxi driver, and you're a passenger who travels in London.\n\n"
            "Start by saying hi 👋",
            "The daily practice ⏰: Meeting at the dog park.\n\n"
            "In today's practice, we are dog owners who meet at the dog park.\n\n"
            "Start by introducing yourself 😊",
            "The daily practice ⏰: Booking a vacation.\n\n"
            "In today's practice, I work at a tourist agency, and you are booking a vacation to Thailand.\n\n"
            "Start by saying hello 👋",
        ]}

    def get(self, idx, lang):
        lang = 'en' if lang is None else lang
        idx = idx % len(self.options[lang])
        return self.options[lang][idx]
