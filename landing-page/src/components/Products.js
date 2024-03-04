import React from "react";
import "../style/Products.scss";
import ProductCard from "./ProductCard";

const monthFeatures = [
  "Cancel anytime!"
];
const yearFeatures = [
  "Save 45% by paying annually",
  "Cancel anytime!"
];
const Products = ({ userToken }) => {
  return (
    <div className="Products">
      <h1>Choose your pricing plan</h1>
      <h2>Cancel anytime quickly and easily by sending "/cancel" to Lingos</h2>
      <div className="cards-wrapper">
        <ProductCard
          id={1}
          title="Monthly"
          price={6.99}
          billingPeriod="Month"
          billingInfo="Billed monthly"
          features={monthFeatures}
          userToken={userToken}
        />
        <ProductCard
          id={2}
          title="Yearly"
          price={45.99}
          priceBeforeDiscount={85}
          discount={45}
          billingPeriod="Year"
          billingInfo="Billed annually"
          features={yearFeatures}
          userToken={userToken}
        />
      </div>
    </div>
  );
};

export default Products;
