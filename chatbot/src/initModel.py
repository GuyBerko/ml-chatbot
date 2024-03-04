from services.ChatBot import ChatBot
from config import create_parser

args = create_parser().parse_args()
chatBot = ChatBot(args)
print('finish download model')