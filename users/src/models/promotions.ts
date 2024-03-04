import mongoose from 'mongoose';

// An interface that describe the properties
// that are required to create a new Promotions
interface PromotionsAttrs {
	userId: number;
	lastShareLink?: Date;
	lastInactivity?: Date;
	lastSubscriptionPromot?: Date;
	lastSpecialSubscriptionPromot?: Date;
}

// An interface that describe the properties
// that a Promotions Model has
interface PromotionsModel extends mongoose.Model<PromotionsDoc> {
	build(attrs: PromotionsAttrs): PromotionsDoc;
}

// An interface that describe the properties
// that a Promotions Document has
export interface PromotionsDoc extends mongoose.Document {
	userId: number;
	lastShareLink: Date;
	lastInactivity: Date;
	lastSubscriptionPromot: Date;
	lastSpecialSubscriptionPromot?: Date;
}

const PromotionsSchema = new mongoose.Schema(
	{
		userId: {
			type: Number,
			required: true,
		},
		lastShareLink: {
			type: Date,
		},
		lastInactivity: {
			type: Date,
		},
		lastSubscriptionPromot: {
			type: Date,
		},
		lastSpecialSubscriptionPromot: {
			type: Date,
		},
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

PromotionsSchema.set('timestamps', true);

PromotionsSchema.statics.build = (attrs: PromotionsAttrs) => new Promotions(attrs);

const Promotions = mongoose.model<PromotionsDoc, PromotionsModel>('Promotions', PromotionsSchema);

export { Promotions };