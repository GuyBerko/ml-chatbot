import mongoose from 'mongoose';

// An interface that describe the properties
// that are required to create a new Offering
interface OfferingAttrs {
    offerKey: string;
    productId: number;
    startDate: Date;
    endDate: Date;
    eligibleCount: number; 
}

// An interface that describe the properties
// that a Offering Model has
interface OfferingModel extends mongoose.Model<OfferingDoc> {
	build(attrs: OfferingAttrs): OfferingDoc;
}

// An interface that describe the properties
// that a Offering Document has
export interface OfferingDoc extends mongoose.Document {
    productId: number;
    offerKey: string;
    startDate: Date;
    endDate: Date;
    eligibleCount: number;
}

const OfferingSchema = new mongoose.Schema(
	{
		offerKey: {
			type: String,
			required: true,
		},
		productId: {
			type: Number,
			required: true,
		},
		startDate: {
			type: Date,
		},
		endDate: {
			type: Date,
		},
		eligibleCount: {
			type: Number,
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

OfferingSchema.set('timestamps', true);

OfferingSchema.statics.build = (attrs: OfferingAttrs) => new Offering(attrs);

const Offering = mongoose.model<OfferingDoc, OfferingModel>('Offering', OfferingSchema);

export { Offering };