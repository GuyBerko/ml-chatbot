import React from "react";
import ContactIcon from "./assets/ContactIcon";
import "./ContactUs.css";

const ContactUs = () => {
  return (
    <a className="constact-us-fab" href="mailto:info@polyglot-ai.com"> 
      <ContactIcon />
    </a>
  );
};

export default ContactUs;
