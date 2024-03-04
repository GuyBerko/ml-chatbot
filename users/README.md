# conversational_ai_db

# first installition

## mongodb

### brew
```
brew tap mongodb/brew
brew install mongodb-community@5.0
brew services start mongodb-community@5.0
```

### for stoping mongodb server run:
```
brew services stop mongodb-community@5.0
```

## Node.Js
```
brew install node
```

### verify installtion by runing
```
node -v
npm -v
```

# Dependencies installtion

- go to project folder and run
```
npm i
```

# Environment
create .env file with the following content
```
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/chatbot
NODE_ENV=development
```

# Runing the server
- go to project folder and run
```
npm start
```

# Api
## /chatBot
```
Url: /chatBot
Method: POST
Body: {
    userId: number;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	openers: string[];
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
	lastUserMessageDate: Date;
	lastBotTextDate: Date;
	lastBotVoiceDate: Date;
    textHistory: string[];
    interactionsCount: number;
	correctionCount: number;
	questionsCount: number;
	avgCharactersPerInput: number;
}
Return status: 201 - ok
               400 - failed
```

```
Url: /chatBot/:userId
Method: GET
Return status: 200 - ok
               404 - user not found
Return body: {
    userId: number;
	fullName: string;
	createdAt: Date;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	openers: string[];
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
	lastUserMessageDate: Date;
	lastBotTextDate: Date;
	lastBotVoiceDate: Date;
    textHistory: string[];
}
```

```
Url: /chatBots
Method: GET
Return status: 200 - ok
               404 - users not found
Return body: [{
    userId: number;
	fullName: string;
	createdAt: Date;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	openers: string[];
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
	lastUserMessageDate: Date;
	lastBotTextDate: Date;
	lastBotVoiceDate: Date;
    textHistory: string[];
}]
```


## /user

```
Url: /user
Method: POST
Body: {
    userId: number;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	creationPlatform: string;
	authorized: boolean;
	chatId: number;
	online: boolean;
	numberOfSessions: number;
}
Return status: 201 - ok
               400 - bad request
               500 - failed
```

```
Url: /user
Method: PUT
Body: {
    userId: number;
	online: boolean;
}
Return status: 200 - ok
               400 - bad request
               404 - user not found
               500 - failed
```

```
Url: /user/:userId
Method: GET
Return status: 200 - ok
               404 - user not found
               500 - failed
Return Body: {
    userId: number;
	createdAt: Date;
	fullName: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	creationPlatform: string;
	authorized: boolean;
	chatId: number;
	online: boolean;
	numberOfSessions: number;
}
```

```
Url: /users
Method: GET
Return status: 200 - ok
               404 - users not found
               500 - failed
Return Body: [{
    userId: number;
	createdAt: Date;
	fullName: string;
	firstName: string;
	lastName: string;
	phoneNumber: string;
	creationPlatform: string;
	authorized: boolean;
	chatId: number;
	online: boolean;
	numberOfSessions: number;
}]
```

```
Url: /analytics
Method: GET
Return status: 200 - ok
               400 - bad request
               404 - users not found
               500 - failed
Return body: [{
    userId: number;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	openers: string[];
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
	lastUserMessageDate: Date;
	lastBotTextDate: Date;
	lastBotVoiceDate: Date;
    textHistory: string[];
    userSessions: {
        id: {
            loginDate: Date;
            logoutDate: Date;
            sessionDuration: string;
        }
    },
    userMetrics: {
        timestemp: {
            interactionsCount: number;
            correctionCount: number;
            questionsCount: number;
            avgCharactersPerInput: number;
            createdAt: Date;
        }
    }
}]
```

```
Url: /analytics/:userId
Method: GET
Return status: 200 - ok
               400 - bad request
               404 - users not found
               500 - failed
Return body: {
    userId: number;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	openers: string[];
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
	lastUserMessageDate: Date;
	lastBotTextDate: Date;
	lastBotVoiceDate: Date;
    textHistory: string[];
    userSessions: {
        id: {
            loginDate: Date;
            logoutDate: Date;
            sessionDuration: string;
        }
    },
    userMetrics: {
        timestemp: {
            interactionsCount: number;
            correctionCount: number;
            questionsCount: number;
            avgCharactersPerInput: number;
            createdAt: Date;
        }
    }
}
```

```
Url: /analytics/summary?date=2022-01-13
Method: GET
Return status: 200 - ok
               404 - users not found
               500 - failed
Return body: {
    totalSum: Number;
    totalReturned: Number;
    returnedFromYesterday: Number;
    newUsers: Number;
}
```

```
Url: /analytics/monthlySummary?date=2022-01-13
Method: GET
Return status: 200 - ok
               500 - failed
Return body: {
    totalDailyActiveUsers: Number;
    totalWeeklyActiveUsers: Number;
    totalMonthlyActiveUsers: Number;
    totalDailyNonActiveUsers: Number;
    totalWeeklyNonActiveUsers: Number;
    totalMonthlyNonActiveUsers: Number;
}
```

```
Url: /analytics/subscription
Method: PUT
Return status: 200 - ok
			   400 - bad request
			   404 - session not found
               500 - failed
Request body: {
    userId: Number;
}
```

```
Url: /promotion
Method: PUT
Body: {
    userId: number;
	lastShareLink?: timestamp;
	lastInactivity?: timestamp;
}
Return status: 201 - ok
               500 - failed
```

```
Url: /promotion/:userId
Method: GET
Return status: 200 - ok
			   404 - not found
               500 - failed
Return Body: {
    userId: number;
	lastShareLink?: timestamp;
	lastInactivity?: timestamp;
}
```

```
Url: /promotions
Method: GET
Return status: 200 - ok
			   404 - not found
               500 - failed
Return Body: [{
    userId: number;
	lastShareLink?: timestamp;
	lastInactivity?: timestamp;
}]
```