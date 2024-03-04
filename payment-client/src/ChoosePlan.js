import React from "react";
import "./ChoosePlan.scss";

const products = {
  monthly: {
    id: 1,
    price: 1000,
    currency: 'USD',
    title: 'Monthly Subscription'
  },
  yearly: {
    id: 2,
    price: 6000,
    currency: 'USD',
    title: 'Yearly Subscription'
  }
};

const ChoosePlan = ({ display, onChoose }) => {
  const onClick = (product) => {
    console.log(product);
    onChoose(product);
  };

  if (!display) return null;

  return (
    <div className="choose-plan">
      <p className="description">Choose a plan</p>

      <div className="grid">
        <div className="card" onClick={() => onClick(products.monthly)}>
          <h2>Monthly</h2>
          <h3>10<small>$</small> / <small>Per Month</small></h3>
          <hr className="hr"></hr>
          <p>Pay for only one month.</p>
          <div className="chooseButtonWrapper">
            <button className="chooseButton">Choose Plan &gt;</button>
          </div>
        </div>

        <div className="card" onClick={() => onClick(products.yearly)}>
          <h2>Yearly</h2>
          <h3>60<small>$</small> / <small>Per Year</small></h3>
          <hr className="hr"></hr>
          <p>Pay for a full year.</p>
          <div className="chooseButtonWrapper">
            <button className="chooseButton">Choose Plan &gt;</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChoosePlan;
