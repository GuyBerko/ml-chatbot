/*
import mongoose from 'mongoose';

// An interface that describe the properties
// that a BotAgent Model has
interface BotAgentModel extends mongoose.Model<BotAgentDoc> {
	build(attrs: BotAgentAttrs): BotAgentDoc;
}

// An interface that describe the properties
// that are required to create a new BotAgent
interface BotAgentAttrs {
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
}

// An interface that describe the properties
// that a BotAgent Document has
interface BotAgentDoc extends mongoose.Document {
	userId: number;
	subjectCount: number;
	maxInteractionsPerSubject: number;
	posFeedbackCount: number;
	lastUserMessageId: number;
	lastBotTextId: number;
	lastBotVoiceId: number;
    openers: string[];
    lastUserMessageDate: Date;
    lastBotTextDate: Date;
    lastBotVoiceDate: Date;
    textHistory: string[];
}

const BotAgentSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
			unique: true
		},
		subjectCount: {
			type: Number,
		},
		maxInteractionsPerSubject: {
			type: Number,
		},
		posFeedbackCount: {
			type: Number,
		},
		lastUserMessageId: {
			type: Number,
		},
		lastBotTextId: {
			type: Number,
		},
		lastBotVoiceId: {
			type: Number,
		},
		openers: {
			type: [String],
		},
		lastUserMessageDate: {
			type: Date
		},
		lastBotTextDate: {
			type: Date
		},
		lastBotVoiceDate: {
			type: Date
		},
		textHistory: {
			type: [String],
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

BotAgentSchema.set('timestamps', true);

BotAgentSchema.statics.build = (attrs: BotAgentAttrs) => new BotAgent(attrs);

const BotAgent = mongoose.model<BotAgentDoc, BotAgentModel>('BotAgent', BotAgentSchema);

export { BotAgent };*/