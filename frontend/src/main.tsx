import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ToastProvider } from "./context/ToastContext";

// Auto-recover from stale dynamic chunk imports following production deployments
window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const reloadKey = "ft_vite_preload_reload_ts";
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();
  // Prevent infinite reload loop if user has lost internet connectivity
  if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
    sessionStorage.setItem(reloadKey, String(now));
    window.location.reload();
  }
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </React.StrictMode>
);
