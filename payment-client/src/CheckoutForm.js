import React, { useEffect, useState } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardCvcElement,
  PaymentRequestButtonElement,
  CardExpiryElement,
} from "@stripe/react-stripe-js";
import axios from "axios";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import useCheckoutFormOptions from "./hooks/useCheckoutFormOptions";
import {
  useCheckoutButtonOptions,
  useCheckoutButtonRequest,
} from "./hooks/useCheckoutButtonOptions";
import "./CheckoutForm.scss";

const CheckoutForm = ({
  display,
  product,
  userToken,
  userCountry = "US",
  setLoading,
  loading,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const formOptions = useCheckoutFormOptions();
  const [cardNumberReady, setCardNumberReady] = useState(false);
  const [cardExpReady, setCardExpReady] = useState(false);
  const [cardCvcReady, setCardCvcReady] = useState(false);
  const [submitButtonDisable, setSubmitButtonDisable] = useState(false);

  const paymentRequest = useCheckoutButtonRequest({
    options: {
      country: userCountry,
      currency: "usd",
      total: {
        label: product.title,
        amount: product.price,
      },
    },
    onPaymentMethod: async ({ complete, token }) => {
      console.log("[PaymentMethod]", token);
      await completeCheckout(token);
      complete("success");
    },
    stripe,
  });

  const checkoutButtonOptions = useCheckoutButtonOptions(paymentRequest);

  const completeCheckout = async (paymentMethod) => {
    const data = {
      paymentMethod,
      product,
      userToken,
    };

    try {
      const { data: resData } = await axios.post(
        `https://polyglot-ai.com/users/create-payment`,
        data
      );

      setSubmitButtonDisable(true);

      //show success notification
      //redirect to bot
      NotificationManager.success(
        "You are beeing redirect back to the bot.",
        "Success",
        1500,
        () => {
          window.location.replace(resData.redirectUrl);
        }
      );

      setTimeout(() => window.location.replace(resData.redirectUrl), 1500);
    } catch (err) {
      //show error notification
      console.error(err);
      const errorMsg =
        err?.response?.data?.description || "We had an issue please try again";
      NotificationManager.error(errorMsg, "Error", 3000);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    const card = elements.getElement(CardNumberElement);
    const result = await stripe.createToken(card);
    if (result.error) {
      console.log(result.error.message);
    } else {
      await completeCheckout(result.token);
    }

    setLoading(false);
  };

  useEffect(() => {
    if (cardCvcReady && cardNumberReady && cardExpReady) {
      setLoading(false);
    }
  }, [cardCvcReady, cardNumberReady, cardExpReady]);

  useEffect(() => {
    if (!display || (cardCvcReady && cardNumberReady && cardExpReady)) return;
    setLoading(true);

    return () => {
      setLoading(false);
    };
  }, [display]);

  if (!display) return null;

  return (
    <div className="checkout-form">
      {paymentRequest && (
        <>
          <PaymentRequestButtonElement options={checkoutButtonOptions} />
          <div className="or-hr">
            <hr />
            OR
            <hr />
          </div>
        </>
      )}
      <form onSubmit={handleSubmit}>
        <label>
          Card number
          <CardNumberElement
            onReady={() => setCardNumberReady(true)}
            options={formOptions}
          />
        </label>
        <label>
          Expiration date
          <CardExpiryElement
            onReady={() => setCardExpReady(true)}
            options={formOptions}
          />
        </label>
        <label>
          CVC
          <CardCvcElement
            onReady={() => setCardCvcReady(true)}
            options={formOptions}
          />
        </label>
        <button
          type="submit"
          disabled={!stripe || loading || submitButtonDisable}
        >
          Pay
        </button>
      </form>
      <NotificationContainer />
    </div>
  );
};

export default CheckoutForm;
