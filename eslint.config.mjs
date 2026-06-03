import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  {
    rules: {
      // L'app charge volontairement les donnees Notion au montage des pages client.
      "react-hooks/set-state-in-effect": "off"
    }
  }
];

export default config;
