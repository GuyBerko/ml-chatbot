import mongoose from 'mongoose';

// An interface that describe the properties
// that are required to create a new Payments
interface PaymentsAttrs {
	userId: string;
	paymentDate: Date;
    product: number;
    amount: number;
    currency: string;
	providerPaymentChargeId: string;
    telegramPaymentChargeId?: string;
    reciptUrl?: string | null;
}

// An interface that describe the properties
// that a Payments Model has
interface PaymentsModel extends mongoose.Model<PaymentsDoc> {
	build(attrs: PaymentsAttrs): PaymentsDoc;
}

// An interface that describe the properties
// that a Payments Document has
export interface PaymentsDoc extends mongoose.Document {
	userId: string;
	paymentDate: Date;
    product: number;
    amount: number;
    currency: string;
	providerPaymentChargeId: string;
    telegramPaymentChargeId?: string;
    reciptUrl?: string | null;
}

const PaymentsSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
		},
		paymentDate: {
			type: Date,
		},
		product: {
			type: Number,
		},
		amount: {
			type: Number,
		},
		currency: {
			type: String,
		},
		providerPaymentChargeId: {
			type: String,
		},
		telegramPaymentChargeId: {
			type: String,
		},
		reciptUrl: {
			type: String,
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

PaymentsSchema.set('timestamps', true);

PaymentsSchema.statics.build = (attrs: PaymentsAttrs) => new Payments(attrs);

const Payments = mongoose.model<PaymentsDoc, PaymentsModel>('Payments', PaymentsSchema);

export { Payments };