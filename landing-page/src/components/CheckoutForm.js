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
import useCheckoutFormOptions from "../hooks/useCheckoutFormOptions";
import {
  useCheckoutButtonOptions,
  useCheckoutButtonRequest,
} from "../hooks/useCheckoutButtonOptions";
import "../style/CheckoutForm.scss";
import { Spin } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import StripeSecureLogo from "../assets/stripe-badge-white.png";

const emailRegex =
  /^(([^<>()\[\]\.,;:\s@\"]+(\.[^<>()\[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/gm;
const defaultProduct = {
  id: 1,
  price: 10,
  currency: "USD",
  title: "Monthly",
  billingPeriod: "Month"
};
const CheckoutForm = ({
  product = defaultProduct,
  userToken,
  userCountry = "US",
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const formOptions = useCheckoutFormOptions();
  const [cardNumberReady, setCardNumberReady] = useState(false);
  const [cardExpReady, setCardExpReady] = useState(false);
  const [cardCvcReady, setCardCvcReady] = useState(false);
  const [submitButtonDisable, setSubmitButtonDisable] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailValid, setEmailValid] = useState(true);
  const [userEmail, setEmail] = useState("");

  const paymentRequest = useCheckoutButtonRequest({
    options: {
      country: userCountry,
      currency: "usd",
      total: {
        label: product.title,
        amount: product.price * 100,
      },
      requestPayerEmail: true,
    },
    onPaymentMethod: async ({ complete, paymentMethod, payerEmail }) => {
      setSubmitButtonDisable(true);

      const body = {
        productId: product.id,
        userToken,
        email: userEmail,
      };

      const { data } = await axios.post(
        `https://polyglot-ai.com/users/create-payment-subscription`,
        body
      );
      const confirmResult = await stripe.confirmCardPayment(
        data.clientSecret,
        { payment_method: paymentMethod.id },
        { handleActions: false }
      );
      if (confirmResult?.error) {
        // Complete with 'fail' and show error:
        NotificationManager.error(confirmResult.error?.message, "Error", 3000);
        setSubmitButtonDisable(false);
        complete("fail");
      } else {
        // Otherwise, close the Payment Request
        // modal and call confirmCardPayment again
        // to complete any potential actions
        // required.
        complete("success");

        const result = await stripe.confirmCardPayment(data.clientSecret);
        if (result.error) {
          NotificationManager.error(result.error?.message, "Error", 3000);
          setSubmitButtonDisable(false);
        } else {
          completeCheckout(data.redirectUrl);
        }
      }
    },
    stripe,
  });

  const checkoutButtonOptions = useCheckoutButtonOptions(paymentRequest);

  const completeCheckout = (redirectUrl) => {
    //setSubmitButtonDisable(true);

    //show success notification
    //redirect to bot
    NotificationManager.success(
      "You are beeing redirect back to the bot.",
      "Success",
      1500,
      () => {
        window.location.replace(redirectUrl);
      }
    );

    setTimeout(() => window.location.replace(redirectUrl), 1500);
  };

  const handleSubmit = async (event) => {
    try {
      event.preventDefault();

      if (!stripe || !elements) {
        NotificationManager.error("Card details are invalid", "Error", 3000);
        return;
      }

      if (!emailValid || !userEmail) {
        NotificationManager.error("Email is invalid", "Error", 3000);
        return;
      }

      setSubmitButtonDisable(true);
      setLoading(true);

      const body = {
        productId: product.id,
        userToken,
        email: userEmail,
      };

      const { data } = await axios.post(
        `https://polyglot-ai.com/users/create-payment-subscription`,
        body
      );

      const card = elements.getElement(CardNumberElement);

      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: userEmail,
          },
        },
      });
      if (result.error) {
        // Display error.message in your UI.
        NotificationManager.error(result.error.message, "Error", 3000);
      } else {
        completeCheckout(data.redirectUrl);
      }
    } catch (err) {
      NotificationManager.error(
        "We had an issue please try again.",
        "Error",
        3000
      );
    } finally {
      setLoading(false);
      setSubmitButtonDisable(false);
    }
  };

  const onEmailChange = (e) => {
    const value = e?.target?.value || "";
    setEmail(value);
  };

  const validateEmail = (e) => {
    const value = e?.target?.value || "";
    setEmailValid(emailRegex.test(value));
  };

  useEffect(() => {
    if (cardCvcReady && cardNumberReady && cardExpReady) {
      setLoading(false);
    }
  }, [cardCvcReady, cardNumberReady, cardExpReady]);

  useEffect(() => {
    const script = document.createElement("script");

    script.src = "https://sdk.getrevin.com/v1.js";
    script["data-revin-seller-account-id"] = "627a02c8a7336b2beaa68936";

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="CheckoutForm">
      {loading && (
        <Spin
          className="loader"
          indicator={
            <LoadingOutlined style={{ fontSize: 150, color: "#42b3d4" }} spin />
          }
          spinning
          tip="Loading"
        />
      )}
      <div className="product-description-wrapper">
        <span className="product-description-text">{product.title} subscription {product.price}$ / {product.billingPeriod}</span>
        
      </div>
      <hr className="product-description-hr" />
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
        <label>
          Email
          <input
            className={`email-input ${emailValid ? "valid" : "invalid"}`}
            onBlur={validateEmail}
            onChange={onEmailChange}
            value={userEmail}
            type="email"
            placeholder="example@example.com"
          />
        </label>
        <button
          type="submit"
          disabled={!stripe || loading || submitButtonDisable}
        >
          Checkout
        </button>
      </form>
      <img
        src={StripeSecureLogo}
        alt="stripe secure payment logo"
        className="stripe-secure-img"
      />

      <NotificationContainer />
      <div className="revin-checkout-terms"></div>
    </div>
  );
};

export default CheckoutForm;
