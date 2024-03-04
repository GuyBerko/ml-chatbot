module.exports = {
  session: {
    driver: "mongo",
    stores: {
      memory: {
        maxSize: 500, // The maximum size of the cache, default is 500.
      },
      mongo: {
        url: 'mongodb://users-mongo:27017/users',
        collectionName: 'bot-sessions',
      },
    },
  },
  initialState:{
    user: {}
  },
  channels: {
    messenger: {
      enabled: true, // Modify this boolean value to enable or disable
      path: "/webhooks/messenger",
      pageId: '',
      accessToken: '',
      appId: '',
      appSecret: '',
      verifyToken: '',
      fields: ['messages', 'messaging_postbacks', 'messaging_referrals'],
      profile: {
        greeting: [
          {
            locale: 'default',
            text: 'Welcome to Lingos 😀\nWe are on a mission to help people improve their English speaking skills.\nYou can speak with Lingos anytime via voice or text messages.\n\nWould you like to start your 3-day free trial?'},
        ],
        getStarted: {
          payload: 'GET_STARTED',
        },
      },
    },
  },
};
