const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || '4003'),
  texts: {
    onBoardMessage: `I will be your English speaking partner.\n\nYou can speak with me via voice messages.\n\nFor words you do not know, simply ask me "What is the definition of.." and I'll be happy to explain.\n\nNow, please tell me something interesting about yourself..`,
  },
  bot: {
    baseUrl: process.env.WEBHOOK_URL,
    maxFreeInteraction: 3 * 60 * 60 * 24 * 1000,
    useCorrection: true
  },
  usersService: {
    baseUrl: process.env.USERS_URL,
  },
  webSpellChecker: {
    baseUrl: process.env.WEB_SPELL_CHECKER_URL,
    token: process.env.WEB_SPELL_CHECKER_TOKEN,
  },
  chatbot: {
    baseUrl: process.env.CHAT_BOT_URL
  }
};

export default config;
