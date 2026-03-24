import axios from "axios";

const API = "http://localhost:5000/api/driver";

export const getDriverEarnings = (token) =>
  axios.get(`${API}/earnings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
