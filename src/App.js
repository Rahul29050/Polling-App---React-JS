import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import LandingPage from './Components/LandingPage/LandingPage'; // Update path here
import Login from './Components/Login/LoginPage'; // Update path here
import Signup from './Components/SignUp/SignupPage'; // Update path here
import Dashboard from './Components/Dashboard/Dashboard';
import PollDetails from './Components/PollDetails/PollDetails';
import MyPolls from './Components/MyPolls/MyPolls';
import PrivateRoute from './Components/Auth/PrivateRoute'; // Update path here
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/dashboard" element={
            <PrivateRoute><Dashboard /></PrivateRoute>
          } />
          <Route path="/poll/:id" element={
            <PrivateRoute><PollDetails /></PrivateRoute>
          } />
          <Route path="/mypolls" element={
            <PrivateRoute><MyPolls /></PrivateRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
