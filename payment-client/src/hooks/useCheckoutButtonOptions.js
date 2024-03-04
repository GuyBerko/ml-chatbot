import React, { useMemo, useState, useEffect } from "react";

export const useCheckoutButtonOptions = (paymentRequest) => {
  const options = useMemo(
    () => ({
      paymentRequest,
      style: {
        paymentRequestButton: {
          theme: "light",
          height: "48px",
          type: "subscribe",
        },
      },
    }),
    [paymentRequest]
  );

  return options;
};

export const useCheckoutButtonRequest = ({
  options,
  onPaymentMethod,
  stripe,
}) => {
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [canMakePayment, setCanMakePayment] = useState(false);

  useEffect(() => {
    if (stripe && paymentRequest === null) {
      const pr = stripe.paymentRequest(options);
      setPaymentRequest(pr);
    }
  }, [stripe, options, paymentRequest]);

  useEffect(() => {
    let subscribed = true;
    if (paymentRequest) {
      paymentRequest.canMakePayment().then((res) => {
        if (res && subscribed) {
          setCanMakePayment(true);
        }
      });
    }

    return () => {
      subscribed = false;
    };
  }, [paymentRequest]);

  useEffect(() => {
    if (paymentRequest) {
      paymentRequest.on("token", onPaymentMethod);
    }
    return () => {
      if (paymentRequest) {
        paymentRequest.off("token", onPaymentMethod);
      }
    };
  }, [paymentRequest, onPaymentMethod]);

  return canMakePayment ? paymentRequest : null;
};
