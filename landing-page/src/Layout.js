import React from "react";
import Logo from "./assets/logo.png";
import { ReactComponent as LeftArrowIcon } from './assets/left-arrow.svg';
import "./style/Layout.scss";
import { useNavigate } from "react-router-dom";

const Layout = ({ children }) => {
  const nav = useNavigate();

  const back = () => {
    nav(-1);
  };

  return (
    <div className="Layout main">
      <header className="header">
        <button className="back-to-bot-btn" onClick={back}>
          <LeftArrowIcon className='left-arrow' /> Back
        </button>
        <img alt="polyglot logo" className="logo" src={Logo} />
      </header>
      {children}
      <footer className="footer">© 2022 LingosAI</footer>
    </div>
  );
};

export default Layout;
