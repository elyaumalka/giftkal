import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Auto-refresh the page once when a newer version takes control,
// so users never need a manual hard refresh (Ctrl+F5).
if ("serviceWorker" in navigator) {
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (reloaded) return;
    reloaded = true;
    window.location.reload();
  });
  // Check for a new version when the tab regains focus.
  const checkForUpdate = () => {
    navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  };
  window.addEventListener("focus", checkForUpdate);
  setInterval(checkForUpdate, 60 * 1000);
}
