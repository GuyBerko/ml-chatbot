import mongoose from "mongoose";

// An interface that describe the properties
// that are required to create a new Interactions
interface InteractionsAttrs {
  userId: number;
  userName: string;
  userPhoneNumber: string;
  adId?: string;
  date: string;
  platform: string;
  messageType: string;
  userMessage: string;
  botReplay: string;
}

// An interface that describe the properties
// that a Interactions Model has
interface InteractionsModel extends mongoose.Model<InteractionsDoc> {
  build(attrs: InteractionsAttrs): InteractionsDoc;
}

// An interface that describe the properties
// that a Interactions Document has
export interface InteractionsDoc extends mongoose.Document {
  userId: number;
  userName: string;
  userPhoneNumber: string;
  adId?: string;
  date: string;
  platform: string;
  messageType: string;
  userMessage: string;
  botReplay: string;
  createdAt: Date;
}

const InteractionsSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
    },
    userPhoneNumber: {
      type: String,
    },
    adId: {
      type: String,
    },
    platform: {
      type: String,
    },
    messageType: {
      type: String,
    },
    userMessage: {
      type: String,
    },
    botReplay: {
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

InteractionsSchema.set("timestamps", true);

InteractionsSchema.statics.build = (attrs: InteractionsAttrs) =>
  new Interactions(attrs);

const Interactions = mongoose.model<
  InteractionsDoc,
  InteractionsModel
>("Interactions", InteractionsSchema);

export { Interactions };
