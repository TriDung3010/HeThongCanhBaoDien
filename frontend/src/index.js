import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css"; // DÒNG NÀY PHẢI CÓ ĐỂ GIAO DIỆN HIỆN LÊN
import App from "./App";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
