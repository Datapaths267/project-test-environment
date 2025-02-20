import { useEffect, useState } from "react";
import "./LoginPage.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from 'axios';


const LoginPage = ({ onLogin }) => {
  const [country, setCountry] = useState("India");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [datas, setData] = useState([]);

  const navigate = useNavigate();

  // const getDatat = async () => {
  //   console.log("response geted1 ");
  //   await axios.get('http://localhost:8000/countryAll')
  //   .then(Response => {    console.log("response get "+JSON.stringify(Response));
  //     setData(Response.data);
  //   })
  // }

  const getData = async () => {
    await axios.get(process.env.REACT_APP_API_URL + 'countryAll')
      .then(response => setData(response.data))
      .catch(error => console.error('Error fetching data:', error));
  };

  useEffect(() => {
    getData()
  }, [])

  // const handleLogin = (e) => {
  //   e.preventDefault();

  //   if (!country || !username || !password) {
  //     toast.error("Please fill all required fields!", {
  //       position: "top-center",
  //       autoClose: 3000,
  //     });
  //     return;
  //   }

  //   if (username === "admin" && password === "admin123") {
  //     localStorage.setItem("role", "admin");
  //     toast.success("Welcome back admin!", {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });

  //     setTimeout(() => {
  //       navigate("/dashboard");
  //     }, 2000);
  //   } 
  //   else if (username === "user" && password === "user123") {
  //     localStorage.setItem("role", "user");
  //     toast.success("Welcome back user!", {
  //       position: "top-right",
  //       autoClose: 3000,
  //     });

  //     setTimeout(() => {
  //       navigate("/dashboard");
  //     }, 2000);
  //   } 
  //   else {
  //     toast.error("Invalid Credentials!", {
  //       position: "top-center",
  //       autoClose: 3000,
  //     });
  //   }
  // };

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
            `${process.env.REACT_APP_API_URL}login`, 
            { username, password, country }
        );

        const { role, message } = response.data;
        console.log(role);

        toast.success(message, {
            position: "top-right",
            autoClose: 3000,
        });

        localStorage.setItem("userRole", role); // Store user role in localStorage
        console.log(role);

        // Redirect based on role
        setTimeout(() => {
            if (role === "Admin" || role === "Admin") {
                window.location.href = "/dashboard/Admin"; // Redirect Admins
            } else {
                window.location.href = "/dashboard"; // Redirect Normal Users
            }
        }, 2000);
    } catch (error) {
        toast.error(error.response?.data?.message || "Login failed!", {
            position: "top-center",
            autoClose: 3000,
        });
    }
};

  return (
    <div className="logincontainer">
        <div className="login-container">
          <div className="login-box">
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
              <input className="login_input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              
              />

              <label className="keep-signed-in">
                <input className="login_input"
                  type="checkbox"
                  checked={keepSignedIn}
                  onChange={(e) => setKeepSignedIn(e.target.checked)}
                />
                Keep me signed in
              </label>

              <button type="submit">Login</button>
              <ToastContainer />
            </form>
            <h5>Forget Password ?</h5>
            <h5>Do not have an account ?</h5>
          </div>
        </div>
    </div>
  );
};

export default LoginPage;
