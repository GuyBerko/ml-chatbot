import mongoose from 'mongoose';

// An interface that describe the properties
// that are required to create a new user
interface UsersAttrs {
	userId: number;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	email?: string;
	creationPlatform: string;
	authorized: boolean;
	chatId: number;
	online: boolean;
	numberOfSessions: number;
	totalInteractions: number;
	subscriptionType?: number;
	subscriptionEndDate?: Date;
	lastUserMessageId?: string;
	lastBotTextId?: string;
	lastBotVoiceId?: string;
	subscriptionId?: string;
	recivedOnBoard: boolean;
	lastUserMessageDate?: Date;
	lastDailyPractice?: Date;
}

// An interface that describe the properties
// that a User Model has
interface UsersModel extends mongoose.Model<UsersDoc> {
	build(attrs: UsersAttrs): UsersDoc;
}

// An interface that describe the properties
// that a User Document has
export interface UsersDoc extends mongoose.Document {
	userId: number;
	firstName: string;
	lastName: string;
	phoneNumber?: string;
	email?: string;
	creationPlatform: string;
	authorized: boolean;
	chatId: number;
	online: boolean;
	numberOfSessions: number;
	createdAt: Date;
	totalInteractions: number;
	subscriptionType: number;
	subscriptionEndDate?: Date;
	lastUserMessageId: string;
	lastBotTextId: string;
	lastBotVoiceId: string;
	recivedOnBoard: boolean;
	subscriptionId?: string;
	lang?: string;
	lastUserMessageDate?: Date;
	lastDailyPractice?: Date;
}

const usersSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
			unique: true
		},
		firstName: {
			type: String,
			default: ''
		},
		lastName: {
			type: String,
			default: ''
		},
		phoneNumber: {
			type: String,
			default: ''
		},
		email: {
			type: String,
			default: ''
		},
		authorized: {
			type: Boolean,
			default: true
		},
		chatId: {
			type: Number,
			default: 0
		},
		creationPlatform: {
			type: String,
			default: 'telegram' // TODO: delete this
		},
		online: {
			type: Boolean,
			default: false
		},
		numberOfSessions: {
			type: Number,
			default: 0
		},
		totalInteractions: {
			type: Number,
			default: 0
		},
		subscriptionType: {
			type: Number,
			default: 0
		},
		subscriptionEndDate: {
			type: Date,
		},
		lastUserMessageId: {
			type: String,
		},
		lastBotTextId: {
			type: String,
		},
		lastBotVoiceId: {
			type: String,
		},
		recivedOnBoard: {
			type: Boolean,
			default: false
		},
		subscriptionId: {
			type: String,
		},
		lang: {
			type: String,
		},
		lastUserMessageDate: {
			type: Date,
		},
		lastDailyPractice: {
			type: Date,
		}
	},
	{
		toJSON: {
			transform(doc, ret) {
				ret.id = ret._id;
				delete ret._id;
			},
		},
	}
);

usersSchema.set('timestamps', true);

usersSchema.statics.build = (attrs: UsersAttrs) => new Users(attrs);

const Users = mongoose.model<UsersDoc, UsersModel>('Users', usersSchema);

export { Users };