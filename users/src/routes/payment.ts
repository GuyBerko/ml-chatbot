import express, { Request, Response } from "express";
import { Users } from "../models/user";
import errors, { stripeErrors } from "../utils/errors";
import { Payments } from "../models/payments";
import { dayjs } from "../utils";
import axios from "axios";
import Stripe from "stripe";
import * as bodyParser from "body-parser";
//@ts-ignore
const stripe = new Stripe(process.env.STRIPE_SECRET);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

const router = express.Router();

const getEndDate = (product: number, paymentDate: Date): Date => {
  switch (product) {
    // set end date according to product type (1: monthly, 2: yearly)
    // and add extra day to avoid expiration before next invoice is paid
    case 1:
      return dayjs(paymentDate).add(1, "month").add(1, "day").toDate();
    case 2:
      return dayjs(paymentDate).add(1, "year").add(1, "day").toDate();
    default:
      console.error(
        `[PaymentRouter][getEndDate] - product: ${product} is not valid`
      );
      return dayjs(paymentDate).toDate();
  }
};

const getProduct = (paymentLink: string | Stripe.PaymentLink | null) => {
  switch (paymentLink) {
    case process.env.MONTHLY_PAYMENT_LINK:
      return 1;
    case process.env.YEARLY_PAYMENT_LINK:
      return 2;
    default:
      throw Error('Unrecognized payment link');
  }
};

const sessionCompletedHandler = async (data: Stripe.Checkout.Session) => {
  // id: subscription id
  // client_reference_id: user id
  // subscription: subscription id of user
  const { client_reference_id, subscription, payment_link } = data;
  const email = data.customer_details?.email?.toString();
  const productType = getProduct(payment_link);
  const botUrl = "http://facebook-srv:4004/complete-payment";

  if (client_reference_id === null) {
    console.error(`[sessionCompletedHandler] - no user id was given, nothing to update.`);
    return;
  }

  // find user in database
  const user = await Users.findOne({ userId: client_reference_id });

  if (!user) {
    console.error(`[sessionCompletedHandler] - could not find user: ${JSON.stringify(client_reference_id)}`);
    return;
  }

  user.subscriptionType = productType;
  console.log(`user.subscriptionEndDate before: ${user.subscriptionEndDate}`)
  user.subscriptionEndDate = getEndDate(productType, new Date());
  user.subscriptionId = subscription?.toString()
  console.log(`user.subscriptionEndDate after: ${user.subscriptionEndDate}`)
  user.email = email;

  await Promise.all([user.save()]);

  // send payment successfuly message
  await axios.post(botUrl, { userId: client_reference_id });
}

const invoicePaidHandler = async (data: Stripe.Invoice) => {
  // subscription: subscription id of user
  const { subscription } = data;

  // find user in database by subscription id
  const user = await Users.findOne({ subscriptionId: subscription?.toString() });

  if (!user) {
    console.error(`[invoicePaidHandler] - could not find user for subscription id: ${JSON.stringify(subscription)}`);
    return;
  }

  // update end date of subscription
  console.log(`user.subscriptionEndDate before: ${user.subscriptionEndDate}`)
  user.subscriptionEndDate = getEndDate(user.subscriptionType, new Date());
  console.log(`user.subscriptionEndDate after: ${user.subscriptionEndDate}`)
  await Promise.all([user.save()]);
}

router.post(
  "/stripe-webhook",
  bodyParser.text({ type: "*/*" }),
  async (req: Request, res: Response) => {
    try {
      const sig = req.headers["stripe-signature"];
      const body = req.body;

      if (!sig) {
        throw Error("could not get sig from header");
      }

      if (!endpointSecret) {
        throw Error("webhook secret is undefined");
      }
      let event: Stripe.Event;
      let dataObject;

      try {
        try {
          event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            endpointSecret
          );
        } catch (err) {
          //@ts-ignore
          console.log(`[PaymentRouter] POST - /stripe-webhook,  Webhook signature verification failed.`, err.message);
          return res.sendStatus(400);
        }

        switch (event.type) {

          case 'checkout.session.completed':
            // payment is successful and the subscription is created.
            dataObject = event.data.object as Stripe.Checkout.Session;
            console.log('------------')
            console.log(`checkout.session.completed:\n${JSON.stringify(dataObject)}`);
            console.log('------------')
            await sessionCompletedHandler(dataObject);
            break;
          case 'invoice.paid':
            // continue to provision the subscription as payments continue to be made.
            dataObject = event.data.object as Stripe.Invoice;
            console.log('------------')
            console.log(`invoice.paid:\n${JSON.stringify(dataObject)}`);
            console.log('------------')
            await invoicePaidHandler(dataObject);
            break;
          case 'invoice.payment_failed':
            // the payment failed or the customer does not have a valid payment method.
            // print error and do not update user subscription
            // TODO: send the user and me a message about this.
            dataObject = event.data.object as Stripe.Invoice;
            console.log('------------')
            console.log(`invoice.payment_failed:\n${JSON.stringify(dataObject)}`);
            console.log('------------')
            console.error("[PaymentRouter] POST - /stripe-webhook, Error: payment failed!, ID:", dataObject.id);
            break;
          default:
            // Unhandled event type
            console.log('------------')
            console.error("[PaymentRouter] POST - /stripe-webhook, Unhandled 🤷 event type: ", event.type);
            console.log(`${event.type}: \n${JSON.stringify(dataObject)}`);
            console.log('------------')
        }
      } catch (err) {
        console.log(err);
      }

      res.status(200).send("ok");
    } catch (err) {
      // @ts-ignore
      const error = err.stack || err.message || err;
      console.error(`[PaymentRouter] POST - /stripe-webhook, Error: ${error}`);
      res.status(500).send(errors[500]);
    }
  }
);

router.post("/cancel-subscription", async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).send(errors[400]);
    }

    const user = await Users.findOne({ userId });

    if (!user) {
      return res.status(404).send(errors[404]);
    }

    if (!user.subscriptionId) {
      return res.status(400).send(errors[400]);
    }

    const deletedSubscription = await stripe.subscriptions.del(user.subscriptionId);

    res.status(200).send({ subscription: deletedSubscription });
  } catch (err) {
    // @ts-ignore
    const error = err.stack || err.message || err;
    console.error(
      `[PaymentRouter] POST - /cancel-subscription, Error: ${error}`
    );
    return res.status(500).send(errors[500]);
  }
});

export { router as paymentRouter };
