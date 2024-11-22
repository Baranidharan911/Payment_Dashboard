import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../../services/authservice';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../../styles/login.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Login = () => {
  const emailRef = useRef();
  const passwordRef = useRef();
  const { login, role } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(emailRef.current.value, passwordRef.current.value);
      toast.success('Successfully logged in');
    } catch (error) {
      setError('Failed to log in');
      toast.error('Failed to log in: ' + error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role) {
      if (role === 'admin') {
        navigate('/admin-dashboard');
      } else if (role === 'manager') {
        navigate('/manager-dashboard');
      } else {
        navigate('/login');
      }
    }
  }, [role, navigate]);

  return (
    <motion.div className="auth-container" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <ToastContainer />
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <p>{error}</p>}
        <div>
          <label>Email</label>
          <input type='email' ref={emailRef} required />
        </div>
        <div className="password-field">
          <label>Password</label>
          <input type={showPassword ? 'text' : 'password'} ref={passwordRef} required />
          <span
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        <Link to="/forgot-password" className="forgot-password">
          Forgot password?
        </Link>
        <button disabled={loading} type='submit'>
          Log In
        </button>
      </form>
    </motion.div>
  );
};

export default Login;
