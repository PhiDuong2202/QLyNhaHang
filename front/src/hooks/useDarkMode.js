import { useEffect, useState } from "react";

export default function useDarkMode() {
  const [isDarkMode, setIsDarkMode] = useState(
    () => localStorage.getItem("darkMode") === "true"
  );

  useEffect(() => {
    const syncDarkMode = () => {
      setIsDarkMode(localStorage.getItem("darkMode") === "true");
    };

    window.addEventListener("darkModeChanged", syncDarkMode);
    window.addEventListener("storage", syncDarkMode);

    return () => {
      window.removeEventListener("darkModeChanged", syncDarkMode);
      window.removeEventListener("storage", syncDarkMode);
    };
  }, []);

  return isDarkMode;
}
