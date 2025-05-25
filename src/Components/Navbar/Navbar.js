import React, { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import axiosInstance from "../../utils/axiosinstance";
import "./Navbar.css";

const Navbar = () => {
  const [showCreatePollDialog, setShowCreatePollDialog] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [visibility, setVisibility] = useState("public");
  const [duration, setDuration] = useState("");
  const [durationUnit, setDurationUnit] = useState("minutes");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileRef = useRef(null);

  const navigate = useNavigate();
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || {}
  );
  const socketRef = useRef(null);
  const notificationRef = useRef(null);

  useEffect(() => {
    socketRef.current = io("http://localhost:3000");

    fetchNotifications();
    fetchUnreadCount();

    // Listen for new poll notifications
    socketRef.current.on("pollCreated", (newPoll) => {
      const currentUser = JSON.parse(localStorage.getItem("user"));

      // Only show notification if it's not the current user who created the poll
      if (newPoll.createdBy.userId !== currentUser._id) {
        // Refresh notifications to get the new ones
        fetchNotifications();
        fetchUnreadCount();
        
        // Show toast notification
        toast.info(`${newPoll.createdBy.username} created a new poll: ${newPoll.question}`);
      }
    });

    const handleClickOutside = (event) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socketRef.current.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchNotifications = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    axiosInstance
      .get(`/notifications?userId=${currentUser._id}`)
      .then((response) => {
        setNotifications(response.data);
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
      });
  };

  const fetchUnreadCount = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    axiosInstance
      .get(`/notifications/unread-count?userId=${currentUser._id}`)
      .then((response) => {
        setUnreadCount(response.data.unreadCount);
      })
      .catch((error) => {
        console.error("Error fetching unread count:", error);
      });
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (notification) => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    axiosInstance
      .patch(`/notifications/${notification._id}/read`, {
        userId: currentUser._id
      })
      .then((response) => {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        
        // Update unread count
        fetchUnreadCount();
        
        toast.success(response.data.message);
      })
      .catch((error) => {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
      });
  };

  const markAllAsRead = () => {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    
    axiosInstance
      .patch('/notifications/read-all', {
        userId: currentUser._id
      })
      .then((response) => {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        
        // Update unread count
        setUnreadCount(0);
        
        toast.success(response.data.message);
      })
      .catch((error) => {
        console.error("Error marking all notifications as read:", error);
        toast.error("Failed to mark all notifications as read");
      });
  };

  const toggleSidebar = () => {
    setShowRightSidebar(!showRightSidebar);
    console.log("Toggle Sidebar Clicked");
  };

  const addOption = () => {
    if (pollOptions.length < 5) {
      setPollOptions([...pollOptions, ""]);
    } else {
      alert("You can only add up to 5 options.");
    }
  };

  const removeOption = (index) => {
    if (index >= 2) {
      const newOptions = [...pollOptions];
      newOptions.splice(index, 1);
      setPollOptions(newOptions);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const openCreatePollDialog = () => {
    setShowCreatePollDialog(true);
  };

  const closeCreatePollDialog = () => {
    setPollQuestion("");
    setPollOptions(["", ""]);
    setVisibility("public");
    setDuration("");
    setDurationUnit("minutes");
    setShowCreatePollDialog(false);
  };

const createPoll = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const postData = {
    question: pollQuestion,
    options: pollOptions,
    visibility: visibility,
    duration: parseInt(duration),
    durationUnit: durationUnit,
    isActive: true,
    createdBy: {
      userId: currentUser._id,
      username: currentUser.fullname,
    },
  };

  axiosInstance
    .post("/api/polls", postData)
    .then((response) => {
      if (response.status === 201) {
        closeCreatePollDialog();
        toast.success("Poll created Successfully");
        
        // Create notifications for all users EXCEPT the current user
        axiosInstance
          .post("/notifications", {
            content: `${currentUser.fullname} created a new poll: ${pollQuestion}`,
            pollId: response.data._id,
            creatorId: currentUser._id // Pass creator ID to exclude them
          })
          .then(() => {
            console.log("Notifications created successfully");
          })
          .catch((error) => {
            console.error("Error creating notifications:", error);
          });
        
        socketRef.current.emit("newPollCreated", postData);
      }
    })
    .catch((error) => {
      console.error("Error creating poll:", error);
    });
};

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
    toast.error("Logout Successfully");
  };

  const dashboard = () => {
    navigate("/dashboard");
  };

  const myPolls = () => {
    navigate("/mypolls");
  };

  // Sort notifications: unread first, then by creation date
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });


  return (
    <div className="navbar">
      <div className="navbar-left">
        <h3>Polling Application</h3>
      </div>

      <div className="navbar-right">
        <button className="dashboard-button" onClick={dashboard}>
          Dashboard
        </button>
        <button className="my-polls-button" onClick={myPolls}>
          My Polls
        </button>
        <button className="create-poll-button" onClick={openCreatePollDialog}>
          Create Poll
        </button>
        <div className="notification-wrapper" ref={notificationRef}>
          <button className="notification-button" onClick={toggleNotifications}>
            <i className="fas fa-bell fa-shake"></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button 
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              
              {sortedNotifications.length === 0 ? (
                <div className="no-notifications">
                  No notifications yet
                </div>
              ) : (
                sortedNotifications.map((notification, index) => (
                  <div 
                    key={notification._id} 
                    className={`notification ${notification.isRead ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      {notification.content}
                    </div>
                    {!notification.isRead && (
                      <span
                        className="mark-as-read"
                        onClick={() => markAsRead(notification)}
                      >
                        <i className="fa-solid fa-check-double"></i>
                        <span className="mark-as-read-tooltip">Mark as Read</span>
                      </span>
                    )}
                    {index < sortedNotifications.length - 1 && <hr />}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        <div className="profile-wrapper" ref={profileRef}>
          <button
            className="profile-button"
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
          >
            {user?.fullname?.charAt(0).toUpperCase() || "U"}
          </button>
          {showProfileDropdown && (
            <div className="profile-dropdown">
              <p>
                <strong>{user.fullname}</strong>
              </p>
              <p>{user.email}</p>
              <hr />
              <button className="logout-button" onClick={logout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
      <button className="toggle-sidebar-button" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>

      {/* Container for right-side buttons in dropdown/sidebar */}
      {showRightSidebar && (
        <div className="right-sidebar-container">
          <button className="dashboard-button" onClick={dashboard}>
            Dashboard
          </button>
          <button className="my-polls-button" onClick={myPolls}>
            My Polls
          </button>
          <button className="create-poll-button" onClick={openCreatePollDialog}>
            Create Poll
          </button>
          <button className="logout-button" onClick={logout}>
            Logout
          </button>
        </div>
      )}

      <Modal
        title="Create Poll"
        open={showCreatePollDialog}
        onOk={createPoll}
        onCancel={closeCreatePollDialog}
        width={1000}
      >
        <div className="create-poll-dialog-content">
          <div className="input-group">
            <label htmlFor="question">Question:</label>
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              id="question"
              type="text"
              placeholder="Enter your question here..."
              required
            />
          </div>

          <div className="options-and-details">
            <div className="options-container">
              <label htmlFor="options" className="optionss">
                Options:
              </label>
              <div className="input-group">
                <div className="options-list">
                  {pollOptions.map((option, index) => (
                    <div key={index} className="option">
                      <div className="option-content">
                        <label htmlFor={`option${index}`} className="numbering">
                          {index + 1}
                        </label>
                        <input
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(index, e.target.value)
                          }
                          id={`option${index}`}
                          type="text"
                          className="option-input"
                          placeholder="Options..."
                          required
                        />
                        {index >= 2 && (
                          <span
                            className="remove-option"
                            onClick={() => removeOption(index)}
                          >
                            ❌
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button
                className="add-option-button"
                onClick={addOption}
                disabled={pollOptions.length >= 5}
              >
                Add Option
              </button>
            </div>

            <div className="duration-visibility-container">
              <label htmlFor="duration">Duration:</label>
              <div className="input-group duration-group">
                <input
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="Enter Duration..."
                  required
                  className="input-field"
                />
                <select
                  value={durationUnit}
                  onChange={(e) => setDurationUnit(e.target.value)}
                  required
                  id="duration-unit"
                  className="input-field duration-unit"
                >
                  <option value="minutes">Minutes</option>
                  <option value="hours">Hours</option>
                  <option value="days">Days</option>
                </select>
              </div>
              <label htmlFor="visibility">Visibility:</label>
              <div className="visibility-options">
                <input
                  checked={visibility === "private"}
                  onChange={() => setVisibility("private")}
                  id="private"
                  name="visibility"
                  type="radio"
                  value="private"
                  required
                  disabled
                  className="radio-center"
                />
                <label htmlFor="private">Private</label>
              </div>
              <div className="visibility-options">
                <input
                  checked={visibility === "public"}
                  onChange={() => setVisibility("public")}
                  id="public"
                  name="visibility"
                  type="radio"
                  value="public"
                  required
                  className="radio-center"
                />
                <label htmlFor="public">Public</label>
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Navbar;