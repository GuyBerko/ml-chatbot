import React from "react";
import ReactDOM from "react-dom";
import "@fontsource/poppins";
import "./index.css";
import App from "./App";
import TermsAndPrivacy from "./routes/TermsAndPrivacy";
import Subscribe from "./routes/Subscribe";
import SuccessfulPayment from "./routes/SuccessfulPayment";
import reportWebVitals from "./reportWebVitals";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import 'react-notifications/lib/notifications.css';

const stripePromise = loadStripe(
  ""  
);

const Main = () => {
  return (
    <BrowserRouter>
      <Routes>
       
        <Route path="/terms" element={<TermsAndPrivacy />} />
        <Route
          path="/subscribe/:userToken"
          element={<Subscribe stripePromise={stripePromise} />}
        />
        <Route path="/successfulPayment" element={<SuccessfulPayment />} />
        <Route path="/:userToken" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
};

ReactDOM.render(<Main />, document.getElementById("root"));

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
