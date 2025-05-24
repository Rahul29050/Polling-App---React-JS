import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SignUpPage.css'; // Make sure to style the password strength
const SignupPage = () => {
  const [user, setUser] = useState({
    fullname: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [passwordStrength, setPasswordStrength] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });

    if (name === 'password') {
      evaluatePasswordStrength(value);
    }
  };

  const evaluatePasswordStrength = (password) => {
    let strength = '';
    let error = '';

    if (password.length < 8) {
      strength = 'Weak';
      error = 'Password must be at least 8 characters long.';
    } else {
      const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
      const mediumRegex = /^(?=.*[a-zA-Z])(?=.*\d).{8,}$/;

      if (strongRegex.test(password)) {
        strength = 'Strong';
      } else if (mediumRegex.test(password)) {
        strength = 'Medium';
      } else {
        strength = 'Weak';
      }
    }

    setPasswordStrength(strength);
    setPasswordError(error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.password.length < 8) {
      alert('Password must be at least 8 characters long.');
      return;
    }

    if (user.password !== user.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    if (passwordStrength === 'Weak') {
      alert('Please choose a stronger password.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/register', user);
      if (response.status === 201) {
        toast.success('Registered Successfully');
        navigate('/login');
      } else {
        alert('Unexpected response status: ' + response.status);
      }
    } catch (error) {
      toast.error('Registration failed. Please try again.');
      console.error(error);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2 className="signup-heading">Sign Up</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Full Name:</label>
            <input
              type="text"
              name="fullname"
              placeholder="Enter your name"
              className="input-field"
              value={user.fullname}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Email:</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className="input-field"
              value={user.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">Password:</label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              className="input-field"
              value={user.password}
              onChange={handleChange}
              required
            />
            {user.password && (
              <>
                <div className={`password-strength ${passwordStrength.toLowerCase()}`}>
                  Strength: {passwordStrength}
                </div>
                {passwordError && <div className="password-error">{passwordError}</div>}
              </>
            )}
          </div>
          <div className="form-group">
            <label className="label">Confirm Password:</label>
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm password"
              className="input-field"
              value={user.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="signup-button">
            Sign Up
          </button>
        </form>
        <p className="login-link">
          Already have an account?{' '}
          <Link to="/login" className="login-button">
            Login now
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;