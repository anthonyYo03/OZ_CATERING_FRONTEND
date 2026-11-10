import axios from 'axios';
import toast from 'react-hot-toast';
import { UserLogin } from '../types/user';
import {useNavigate } from 'react-router-dom';
import { useState } from 'react';
import logo from '../assets/oz-logo-white.png';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState<UserLogin>({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!login.username || !login.password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try { 
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/user/login`, login, { withCredentials: true });
      console.log(response.data);
      toast.success('Login successful!');
      if (response.data.roles === 'admin') {
        setTimeout(() => navigate('/adminDashboard'), 1000);
      } else if (response.data.roles === 'observer') {
        setTimeout(() => navigate('/observerDashboard'), 1000);
      } else {
        toast.error('There is no dashboard for this account yet');
      }
     
    //   const role = response.data.type;
    //   if (role === 'reader') {
    //     setTimeout(() => navigate('/readerDashboard'), 1000);
    //   } else if (role === 'journalist') {
    //     setTimeout(() => navigate('/journalistDashboard'), 1000);
    //   } else if (role === 'admin') {
    //     setTimeout(() => navigate('/adminDashboard'), 1000);
    //   }
     
      setLogin({ username: '', password: '' });
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed.');
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-0">
      <div className="row g-0 min-vh-100">
        <div className="col-lg-6 oz-login-brand d-flex align-items-center justify-content-center">
          <img src={logo} alt="OZ by ozarome" className="oz-login-logo" />
        </div>

        <div className="col-lg-6 oz-login-panel d-flex align-items-center justify-content-center">
          <div className="oz-login-form">
            <div className="mb-4 pb-2">
              <h1 className="oz-login-title">Welcome Back</h1>
              <p className="oz-eyebrow mb-0">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  id="username"
                  className="form-control"
                  value={login.username}
                  onChange={e => setLogin({ ...login, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>

              <div className="mb-4">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className="form-control"
                    value={login.password}
                    onChange={e => setLogin({ ...login, password: e.target.value })}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary oz-login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              <div className="d-flex gap-3 pt-2">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/')} disabled={loading}>
                  Back
                </button>
                <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}