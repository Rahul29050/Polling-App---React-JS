import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css'; // Import the stylesheet

const LandingPage = () => {
  const [imageLoaded, setImageLoaded] = useState(false);
  
  useEffect(() => {
    // Set the imageLoaded state to true after a small delay to trigger animation
    const timer = setTimeout(() => {
      setImageLoaded(true);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-page">
      <div className="heading">
        <h1 className="custom-heading">Welcome to Real-Time Interactive Democracy</h1>
      </div>
      
      <div className="content">
        <div className="left-content">
          <div className={`image-container ${imageLoaded ? 'animate' : ''}`}>
            <img
              src='../../assets/images/Polls.gif'
              alt="Real-time polling animation"
              className="landing-image"
              onLoad={() => setImageLoaded(true)}
            />
          </div>
          <p className={`tagline ${imageLoaded ? 'animate' : ''}`}>
            "Empowering Voices, Shaping Tomorrow: Join our Real-Time Polling System and engage in the democratic process like never before."
          </p>
        </div>
        
        <div className={`button-container ${imageLoaded ? 'animate' : ''}`}>
          <Link to="/login" className="landing-login-button">Login</Link>
          <Link to="/signup" className="landing-signup-button">Signup</Link>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;