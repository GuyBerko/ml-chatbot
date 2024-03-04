import React from "react";
import CheckoutForm from "../components/CheckoutForm";
import { Elements } from "@stripe/react-stripe-js";
import { useLocation } from "react-router-dom";
import Layout from "../Layout";
import { useParams } from 'react-router-dom'

const Subscribe = ({ stripePromise }) => {
  const location = useLocation();
  const { userToken } = useParams();
  
  return (
    <Elements stripe={stripePromise}>
      <Layout>
        <CheckoutForm product={location.state?.product} userToken={userToken}/>
      </Layout>
    </Elements>
  );
};

export default Subscribe;
