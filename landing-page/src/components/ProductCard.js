import React from "react";
import "../style/ProductCard.scss";
import { ReactComponent as RightArrowIcon } from "../assets/right-arrow.svg";
import { useNavigate } from "react-router-dom";

const ProductCard = ({
  id,
  title,
  price,
  discount,
  billingPeriod,
  features,
  priceBeforeDiscount,
  billingInfo,
  userToken
}) => {
  const navigate = useNavigate();

  const getPricing = () => {
    const pricingTitle = [];
    if (priceBeforeDiscount) {
      pricingTitle.push(<s key='price-s'>{priceBeforeDiscount}$</s>);
      pricingTitle.push(" ");
    }

    pricingTitle.push(`${price}$ `);
    pricingTitle.push("/ ");
    pricingTitle.push(billingPeriod);

    return pricingTitle;
  };

  const onChoose = () => {
    if (!userToken) {
      return window.location.replace("https://m.me/polyglot.speaking.partner");
    }

    const product = {
      id,
      price,
      currency: "USD",
      title,
      billingPeriod
    };
    navigate(`/subscribe/${userToken}`, { state: { product } });
  };

  return (
    <div className={`ProductCard ${title}`}>
      <h2>{title}</h2>
      <div className="price-title">{getPricing()}</div>
      <div className="billing-info">{billingInfo}</div>
      <ul>
        {features.map((feature, i) => (
          <li key={`feature-li-${i}`}>{feature}</li>
        ))}
      </ul>
      <button className="choose-plan-button" onClick={onChoose}>
        Choose Plan <RightArrowIcon />
      </button>
    </div>
  );
};

export default ProductCard;
