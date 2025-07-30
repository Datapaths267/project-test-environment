import React from "react";
import { useEffect, useState } from "react";
import "./LoginPage.css"; // Assuming this is the file where you want to add the styles
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import { Eye, EyeOff } from 'lucide-react'; // Make sure you have lucide-react installed

const LoginPage = ({ onLogin }) => {
  const [country, setCountry] = useState("India");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [datas, setData] = useState([]);

  const navigate = useNavigate();

  const getData = async () => {
    console.log("Fetching country data..."); // Debugging
    await axios.get(process.env.REACT_APP_API_URL + 'api/countryAll')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  };

  useEffect(() => {
    getData()
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!country || !username || !password) {
      toast.error("Please fill all required fields!", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}auth/login`,
        { username, password, country }
      );

      const { role, token, message } = response.data;

      toast.success(message, {
        position: "top-right",
        autoClose: 3000,
      });

      // Decode token and store values
      const decodedToken = jwtDecode(token);
      console.log("Decoded Token:", decodedToken); // Debugging

      const employeeId = decodedToken.employee_id || "";
      const designation = decodedToken.designation || "";
      const companyId = decodedToken.companyId || "";
      const companyName = decodedToken.companyName || "";
      const decodedcountry = decodedToken.country || "";
      const employeeName = decodedToken.employeeName || "";

      localStorage.setItem("userRole", role.toLowerCase());
      localStorage.setItem("authToken", token);
      localStorage.setItem("designation", designation);
      localStorage.setItem("employeeId", employeeId);
      localStorage.setItem("companyId", companyId);
      localStorage.setItem("companyName", companyName);
      localStorage.setItem("country", decodedcountry);
      localStorage.setItem("employeeName", employeeName);

      console.log("Stored Company Name:", companyName);
      console.log("Stored employee id:", employeeId);
      console.log("Stored Employee Designation:", designation);

      setTimeout(() => {
        navigate("/dashboard/profile");
      }, 500);  // Ensure storage before navigation
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed!", {
        position: "top-center",
        autoClose: 3000,
      });

      console.log("Error occurred in login:", error);
    }
  };

  return (
    <div className="logincontainer">
      <div className="login-container">
        <div className="login-box">
          <div className="Logo">
            <img src="Data-Paths.png" alt="Logo" />
          </div>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <label>Country:</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)}>
              {datas.length > 0 ? (
                datas.map((item, index) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))
              ) : (
                <option>Loading...</option>
              )}
            </select>

            <label>Username:</label>
            <input className="login_input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <label>Password:</label>
            <div className="password-container">
              <input className="login_input"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <span
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </span>
            </div>

            <label className="keep-signed-in">
              <input className="login_input"
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
              />
              Keep me signed in
            </label>

            <button type="submit">Login</button>
          </form>
          <h5>Forget Password?</h5>
          <h5>Do not have an account?</h5>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;