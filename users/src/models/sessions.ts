import mongoose from 'mongoose';

// An interface that describe the properties
// that are required to create a new Sessions
interface SessionsAttrs {
	userId: number;
	loginDate: Date;
	logoutDate?: Date;
	paymentRequestTime?: Date;
	didExceededInteractionLimit?: boolean;
	interactionsCount?: number; 
}

// An interface that describe the properties
// that a Sessions Model has
interface SessionsModel extends mongoose.Model<SessionsDoc> {
	build(attrs: SessionsAttrs): SessionsDoc;
}

// An interface that describe the properties
// that a Sessions Document has
export interface SessionsDoc extends mongoose.Document {
	userId: number;
	loginDate: Date;
	logoutDate: Date;
	paymentRequestTime: Date;
	didExceededInteractionLimit: boolean;
	interactionsCount: number; 
}

const SessionsSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
		},
		loginDate: {
			type: Date,
		},
		logoutDate: {
			type: Date,
		},
		paymentRequestTime: {
			type: Date,
		},
		didExceededInteractionLimit: {
			type: Boolean,
		},
		interactionsCount: {
			type: Number,
			default: 0
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

SessionsSchema.set('timestamps', true);

SessionsSchema.statics.build = (attrs: SessionsAttrs) => new Sessions(attrs);

const Sessions = mongoose.model<SessionsDoc, SessionsModel>('Sessions', SessionsSchema);

export { Sessions };