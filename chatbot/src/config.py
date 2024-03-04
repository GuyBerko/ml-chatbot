import argparse


def create_parser():
    parser = argparse.ArgumentParser(description="TelegramBot Configuration")
    # parser.add_argument("--model-file", default="zoo:blenderbot2/blenderbot2_400M/model", type=str, help="conversational bot model file")
    parser.add_argument('--model-file', default='zoo:blenderbot2/blenderbot2_3B/model', type=str)
    #parser.add_argument("--model-file", default="zoo:blender/blender_90M/model", type=str, help="conversational bot model file")
    parser.add_argument("--use-correction", action="store_true", default=False, help="use grammar correction")
    parser.add_argument("--onboard-path", default="./txt/onboard_msg.txt", type=str, help="onboard message text file")
    parser.add_argument("--openers-path", default="./txt/openers.txt", type=str, help="subject openers text file")
    parser.add_argument("--first-pos-feedback-path", default="./txt/first_positive_feedback.txt", type=str, help="the first positive feedback message")
    parser.add_argument("--bridge-path", default="./txt/bridge_sentences.txt", type=str, help="bridge sentences text file")
    parser.add_argument("--pos-feedback-path", default="./txt/positive_feedback.txt", type=str, help="positive feedback text file")
    parser.add_argument("--max-interactions-per-subject", default=6, type=int, help="maximum number of interactions before changing a subject")
    parser.add_argument("--use-bot-text", action="store_true", default=False, help="if set, sends bot text message as well")
    parser.add_argument("--use-user-text", action="store_true", default=False, help="if set, sends STT as text message")
    parser.add_argument(
        "--pos-feedback-period", default=5, type=int, help="number of consecutive interactions without correction " "after which we provide positive feedback"
    )
    parser.add_argument("--ask-for-phone-number", action="store_true", default=False, help="if set, the bot should ask new users for phone number")
    parser.add_argument("--init-users-interval", default=60, type=int, help="(re)init users every init-users-interval secs")
    parser.add_argument("--save-interval", default=900, type=int, help="save user data every save-interval secs")
    parser.add_argument("--max-inactive", default=900, type=int, help="idleness above this threshold (in secs), and user is considered inactive")
    parser.add_argument("--authorization-default", default=True, type=bool, help="should new users be authorized by default")
    parser.add_argument("--payment-title", default="Polyglot", type=str, help="The payment request title")
    parser.add_argument(
        "--payment-thank-you", default="Thanks! You can send a message and continue practicing 😊", type=str, help="The payment thank you message"
    )
    parser.add_argument(
        "--payment-desciption",
        default="""Get unlimited for only {}$ / month\n You're doing a great job practicing your English skills 🤟\nUnfortunately, you have reached your daily limit.""",
        type=str,
        help="The payment body message",
    )
    parser.add_argument("--payment-amount", default=200, help="the amount that user need to pay for subsription in cents")
    parser.add_argument("--free-message-limit", default=5, help="the interactions count that user have in free subsription")
    parser.add_argument('--inference', default='delayedbeam', const='beam', nargs='?',
                        choices=['beam', 'delayedbeam'],
                        help='model inference type (default: %(default)s)')
    parser.add_argument("--beam-delay", default=20, type=int,
                        help="used in delayedbeam search. Affects randomization (default: %(default)s)")
    parser.add_argument("--save-audio", default=False, action="store_true",
                        help="If true voice messages will be saved localy")
   
    return parser
