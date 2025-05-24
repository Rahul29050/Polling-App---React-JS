import React, { useState, useEffect, useRef } from "react";
import { Modal } from "antd";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { io } from "socket.io-client";
import axiosInstance from "../../utils/axiosinstance"; // Adjust the import path as necessary
import "./Navbar.css"; // Make sure to create this CSS file

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

    socketRef.current.on("pollCreated", (newPoll) => {
      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (newPoll.createdBy.userId !== currentUser._id) {
        const notificationContent = `${newPoll.createdBy.username} created a new poll: ${newPoll.question}`;

        axiosInstance
          .post("/notifications", {
            content: notificationContent,
            userId: newPoll.createdBy.userId,
          })
          .then((response) => {
            console.log(response.data);
          })
          .catch((error) => {
            console.error("Error creating notification:", error);
          });

        setNotifications((prev) => [
          ...prev,
          {
            content: notificationContent,
            isRead: false,
          },
        ]);
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
    axiosInstance
      .get("/notifications")
      .then((response) => {
        const currentUser = user._id;
        setNotifications(
          response.data.filter(
            (notification) => notification.userId !== currentUser
          )
        );
      })
      .catch((error) => {
        console.error("Error fetching notifications:", error);
      });
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAsRead = (notification) => {
    const notificationId = notification._id;

    axiosInstance
      .put(`/notifications/${notificationId}/read`)
      .then((response) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        toast.success(response.data.message);
      })
      .catch((error) => {
        console.error("Error marking notification as read:", error);
        toast.error("Failed to mark notification as read");
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
          socketRef.current.emit("newPollCreated", postData);
        } else {
          console.error(
            "Failed to create poll:",
            response.status,
            response.statusText
          );
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

  const sortedNotifications = [...notifications].sort((a, b) => {
    return a.isRead === b.isRead ? 0 : a.isRead ? 1 : -1;
  });

  const unreadNotifications = sortedNotifications.filter((n) => !n.isRead);

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
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              {unreadNotifications.map((notification, index) => (
                <div key={index} className="notification">
                  {notification.content}
                  <span
                    className="mark-as-read"
                    onClick={() => markAsRead(notification)}
                  >
                    <i className="fa-solid fa-check-double"></i>
                    <span className="mark-as-read-tooltip">Mark as Read</span>
                  </span>
                  {index < unreadNotifications.length - 1 && <hr />}
                </div>
              ))}
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
