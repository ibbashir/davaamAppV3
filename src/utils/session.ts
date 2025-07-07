// utils/session.ts

import axios from "axios";

export const showSessionExpiredModal = () => {
  // E.g., use Redux, Zustand or direct state:
  // dispatch(openModal("SessionExpired"))
  alert("Session expired. Please log in again."); // TEMP fallback
  logoutUser();
};

export const logoutUser = async () => {
  try {
    await axios.post("/auth/logout", {}, { withCredentials: true });
  } catch (err) {
    console.error("Logout failed", err);
  }

  // Clear memory token
  window.location.href = "/login";
};
