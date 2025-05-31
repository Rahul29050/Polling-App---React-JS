// Components/Auth/OTPVerification.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './OTPVerification.css';

const OTPVerification = ({ tempToken, email, onSuccess, onBack }) => {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanResend(true);
        }
    }, [countdown]);

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        
        if (otp.length !== 6) {
            toast.error('Please enter a valid 6-digit OTP');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/verify-otp', {
                otp,
                tempToken
            });

            if (response.data && response.data.user) {
                toast.success('Login successful!');
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onSuccess(otp);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP verification failed');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        try {
            await axios.post('http://localhost:3000/resend-otp', { tempToken });
            setCountdown(60);
            setCanResend(false);
            toast.success('OTP resent successfully!');
        } catch (error) {
            toast.error('Failed to resend OTP');
        }
    };

    const handleOtpChange = (e) => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
        setOtp(value);
    };

    return (
        <div className="otp-container">
            <div className="otp-box">
                <button onClick={onBack} className="back-button2">
                        ← Back
                </button>
                <h2 className="otp-heading">Verify Your Email</h2>
                <p className="otp-description">
                    We've sent a 6-digit verification code to
                    <br />
                    <strong>{email}</strong>
                </p>
                
                <form onSubmit={handleVerifyOTP}>
                    <div className="form-group">
                        <label className="label">Enter OTP:</label>
                        <input
                            type="text"
                            value={otp}
                            onChange={handleOtpChange}
                            placeholder="000000"
                            className="otp-input"
                            maxLength="6"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        className="verify-button"
                        disabled={loading || otp.length !== 6}
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>
                
                <div className="resend-section">
                    {!canResend ? (
                        <p className="countdown-text">
                            Resend OTP in {countdown}s
                        </p>
                    ) : (
                        <button 
                            onClick={handleResendOTP} 
                            className="resend-button"
                        >
                            Resend OTP
                        </button>
                    )}
                </div>
                

            </div>
        </div>
    );
};

export default OTPVerification;