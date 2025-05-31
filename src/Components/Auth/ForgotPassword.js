import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ForgotPassword.css';

const ForgotPassword = ({ onSuccess, onBack }) => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [tempToken, setTempToken] = useState('');
    const [passwordResetToken, setPasswordResetToken] = useState('');
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP to email
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/forgot-password', { email });
            
            if (response.data && response.data.tempToken) {
                setTempToken(response.data.tempToken);
                setStep(2);
                toast.success('Password reset OTP sent to your email!');
            }
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('No account found with this email address');
            } else {
                toast.error('Failed to send OTP. Please try again.');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/verify-password-reset-otp', {
                otp,
                tempToken
            });
            
            if (response.data && response.data.passwordResetToken) {
                setPasswordResetToken(response.data.passwordResetToken);
                setStep(3);
                toast.success('OTP verified! Now set your new password.');
            }
        } catch (error) {
            if (error.response?.status === 401) {
                toast.error('Invalid or expired OTP. Please try again.');
            } else {
                toast.error('OTP verification failed. Please try again.');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters long');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post('http://localhost:3000/reset-password', {
                newPassword,
                passwordResetToken
            });
            
            if (response.data) {
                toast.success('Password reset successfully!');
                onSuccess();
            }
        } catch (error) {
            if (error.response?.status === 401) {
                toast.error('Password reset session expired. Please start over.');
                setStep(1);
                resetForm();
            } else {
                toast.error('Failed to reset password. Please try again.');
            }
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Resend OTP
    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await axios.post('http://localhost:3000/resend-otp', { tempToken });
            toast.success('OTP resent successfully!');
        } catch (error) {
            toast.error('Failed to resend OTP. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setEmail('');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setTempToken('');
        setPasswordResetToken('');
    };

    const handleBack = () => {
        if (step === 1) {
            onBack();
        } else {
            setStep(step - 1);
        }
    };

    return (
        <div className="forgot-password-container">
            <div className="forgot-password-box">
                <div className="header">
                    <button onClick={handleBack} className="back-button1">
                        ← Back
                    </button>
                    <h2 className="forgot-password-heading">
                        {step === 1 && 'Forgot Password'}
                        {step === 2 && 'Verify OTP'}
                        {step === 3 && 'Reset Password'}
                    </h2>
                </div>

                {/* Step 1: Enter Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP}>
                        <p className="step-description">
                            Enter your email address and we'll send you an OTP to reset your password.
                        </p>
                        <div className="form-group">
                            <label className="label">Email Address:</label>
                            <input
                                type="email"
                                placeholder="Enter your email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="primary-button"
                            disabled={loading}
                        >
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: Enter OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP}>
                        <p className="step-description">
                            We've sent a 6-digit OTP to <strong>{email}</strong>. 
                            Please enter it below to continue.
                        </p>
                        <div className="form-group">
                            <label className="label">Enter OTP:</label>
                            <input
                                type="text"
                                maxLength="6"
                                placeholder="Enter 6-digit OTP"
                                className="input-field otp-input"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                required
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="primary-button"
                            disabled={loading || otp.length !== 6}
                        >
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>
                        
                        <div className="resend-section">
                            <p>Didn't receive the OTP?</p>
                            <button 
                                type="button" 
                                onClick={handleResendOTP}
                                className="resend-button"
                                disabled={loading}
                            >
                                Resend OTP
                            </button>
                        </div>
                    </form>
                )}

                {/* Step 3: Set New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword}>
                        <p className="step-description">
                            Create a new password for your account.
                        </p>
                        <div className="form-group">
                            <label className="label">New Password:</label>
                            <input
                                type="password"
                                placeholder="Enter new password"
                                className="input-field"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Confirm Password:</label>
                            <input
                                type="password"
                                placeholder="Confirm new password"
                                className="input-field"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength="6"
                            />
                        </div>
                        <button 
                            type="submit" 
                            className="primary-button"
                            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
                        >
                            {loading ? 'Resetting...' : 'Reset Password'}
                        </button>
                        
                        {newPassword !== confirmPassword && confirmPassword.length > 0 && (
                            <p className="error-message">Passwords do not match</p>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;