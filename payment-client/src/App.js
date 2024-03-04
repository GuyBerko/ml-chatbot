import React, { useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import CheckoutForm from "./CheckoutForm";
import ChoosePlan from "./ChoosePlan";
import Logo from "./logo.png";
import "./App.scss";
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(
  "pk_test_51IIfQXGp7Ot0L3hwbJxwG41dQAatQWDzM5rpygpCjUCmLDWs7u4HWv7rK770Fjn0sjp4BJ160l8kyrov2s22fXfT00Vj3VzPxm"
);

const App = () => {
  const [displayChoosePlan, setDisplayChoosePlan] = useState(true);
  const [displayCheckoutForm, setDisplayCheckoutForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setChoosenProduct] = useState({
    id: 1,
    price: 1000,
    currency: "USD",
    title: "Monthly Subscription",
  });

  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const userToken = urlParams.get("token");

  if (!userToken) {
    return window.location.replace("https://t.me/polyglot_ai_bot");
  }

  const onChooseProduct = (product) => {
    setDisplayChoosePlan(false);
    setDisplayCheckoutForm(true);
    setChoosenProduct(product);
  };

  const back = () => {
    if (displayCheckoutForm) {
      setDisplayCheckoutForm(false);
      setDisplayChoosePlan(true);
    } else {
      window.location.replace("https://t.me/polyglot_ai_bot");
    }
  };

  return (
    <Elements stripe={stripePromise}>
      <div className="App">
        {loading && <Spin className="loader" indicator={<LoadingOutlined style={{ fontSize: 150, color: '#42b3d4' }} spin />} spinning tip="Loading" />}
        <header className="header">
          <button className="back-to-bot-btn" onClick={back}>
            &#8592; Back
          </button>
          <img className="logo" src={Logo} width="300px" height="100px"></img>
        </header>

        <main className="main">
          <ChoosePlan onChoose={onChooseProduct} display={displayChoosePlan} />
          <CheckoutForm
            setLoading={setLoading}
            product={product}
            display={displayCheckoutForm}
            userToken={userToken}
            loading={loading}
          />
        </main>

        <footer className="footer">
          <a
            href="https://polyglot.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            © {new Date().getFullYear()} Polyglot
          </a>
        </footer>
      </div>
    </Elements>
  );
};

export default App;
