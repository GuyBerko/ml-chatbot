import React from "react";
import "./style/App.scss";
import Video from "./assets/video.mp4";
import TelegramLogo from "./assets/telegramLogo.png";
import Products from "./components/Products";
import Layout from "./Layout";
import { useParams } from 'react-router-dom'

const App = () => {
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  const from = urlParams.get("from") || "unknown";
  const { userToken } = useParams();

  window.gtag("event", "pageview", {
    url: window.location.pathname + window.location.search,
  });

  const onStart = () => {
    window.gtag("event", "Redirect", {
      action: `Redirect to telegram`,
      label: `Arrived from`,
      value: from,
    });

    window.gtag("event", "conversion", {
      send_to: "",
      event_callback: () =>
        window.open("https://t.me/polyglot_ai_bot", "_blank"),
    });
  };

  return (
    <Layout>
      <Products userToken={userToken} />
    </Layout>
  );
};

export default App;
