import axios from "axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

export const handleLogout = async (navigate: ReturnType<typeof useNavigate>) => {
  try {
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/logout`, {}, { withCredentials: true });
    toast.success("Successfully Logged Out");
    setTimeout(() => {
      navigate("/");
    }, 700);
  } catch (error: any) {
    toast.error(error?.response?.data?.message || "Failed to logout");
  }
};
  