const config = {
  env: process.env.NODE_ENV,
  port: parseInt(process.env.PORT || "4004"),
  texts: {
    paymentRequest: `Your trial period is over.\n\nGo unlimited for just $8.99/month or $45.99/year\n\n-- Cancel anytime quickly and easily by sending Lingos the message '/cancel'.\n-- Save 57% by paying yearly\n\nWe are here for you at info@lingos.ai`,
    cancelSubscriptionButton: `Do you want to cancel your subscription?`,
    subscriptionCanceled: `Your subscription has been canceled!`,
    subscriptionKept: `Your subscription will not be canceled!`,
    somethingWentWrong: `Something went wrong. Please contact info@lingos.ai`,
    paymentSuccess: `Congratulations on your new subscription! 🎉 \n\nLet's keep going!💪`,
    whatCanWeDoTip: `Tip: You can ask about word definitions, grammar rules, and even role-play with Lingos to enrich your language.`
  },
  bot: {
    maxFreeInteractionCount: 20,
    useCorrection: true,
  },
  usersService: {
    baseUrl: process.env.USERS_URL,
  },
  schedulerService: {
    baseUrl: process.env.SCHEDULER_URL,
  },
  webSpellChecker: {
    baseUrl: process.env.WEB_SPELL_CHECKER_URL,
    token: process.env.WEB_SPELL_CHECKER_TOKEN,
  },
  chatbot: {
    baseUrl: process.env.CHAT_BOT_URL,
  },
  nlu: {
    baseUrl: process.env.NLU_URL,
  },
  stripe: {
    monthlyURL: process.env.STRIPE_MONTHLY_URL,
    yearlyURL: process.env.STRIPE_YEARLY_URL,
  },
};

export default config;
