import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import OTPVerification from '../Auth/OTPVerification';
import './LoginPage.css';
import 'react-toastify/dist/ReactToastify.css';

const LoginPage = () => {
    const [userData, setUserData] = useState({ email: '', password: '' });
    const [showOTP, setShowOTP] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setUserData({ ...userData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/login', userData);
            
            if (response.data && response.data.requiresOTP) {
                // 2FA required
                setTempToken(response.data.tempToken);
                setUserEmail(response.data.email);
                setShowOTP(true);
                toast.success('OTP sent to your email!');
            } else if (response.data && response.data.user) {
                // Direct login (fallback for users without 2FA)
                toast.success('Login Successfully');
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error('Invalid Credentials');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleOTPSuccess = () => {
        navigate('/dashboard');
    };

    const handleBackToLogin = () => {
        setShowOTP(false);
        setTempToken('');
        setUserEmail('');
        setUserData({ email: '', password: '' });
    };

    if (showOTP) {
        return (
            <OTPVerification
                tempToken={tempToken}
                email={userEmail}
                onSuccess={handleOTPSuccess}
                onBack={handleBackToLogin}
            />
        );
    }

    return (
        <div className="login-container">
            <div className="login-box">
                <h2 className="login-heading">Login</h2>
                <form onSubmit={handleSubmit} noValidate>
                    <div className="form-group">
                        <label className="label">Email:</label>
                        <input 
                            type="email" 
                            name="email" 
                            placeholder="Enter your email" 
                            className="input-field" 
                            value={userData.email} 
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
                            value={userData.password} 
                            onChange={handleChange} 
                            required 
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <p className="signup-link">
                    Don't have an account? 
                    <Link to="/signup" className="signup-button"> Sign up now</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;