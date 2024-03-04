import React, { useMemo, useEffect, useState } from "react";

const useResponsiveFontSize = () => {
  const getFontSize = () => (window.innerWidth < 450 ? "16px" : "18px");
  const [fontSize, setFontSize] = useState(getFontSize);

  useEffect(() => {
    const onResize = () => {
      setFontSize(getFontSize());
    };

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  });

  return fontSize;
};

const useCheckoutFormOptions = () => {
  const fontSize = useResponsiveFontSize();
  const options = useMemo(
    () => ({
      iconStyle: "solid",
      style: {
        base: {
          iconColor: "rgb(240, 57, 122)",
          fontSize,
          color: "#424770",
          letterSpacing: "0.025em",
          fontFamily: "-apple-system, Roboto, sans-serif",
          "::placeholder": {
            color: "#aab7c4",
          },
        },
        invalid: {
          color: "#eb1c26",
          border: "1px solid #eb1c26",
          ":focus": {
            color: "#303238",
          },
        },
      },
    }),
    [fontSize]
  );

  return options;
};

export default useCheckoutFormOptions;
