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
  
  // New states for user selection
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const profileRef = useRef(null);
  const userDropdownRef = useRef(null);

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
    fetchUsers(); // Fetch all users for selection

    socketRef.current.on("pollCreated", (newPoll) => {
      const currentUser = JSON.parse(localStorage.getItem("user"));

      if (newPoll.createdBy.userId !== currentUser._id) {
        fetchNotifications();
        fetchUnreadCount();
        
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
      
      if (
        userDropdownRef.current &&
        !userDropdownRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      socketRef.current.disconnect();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch all users for selection
  const fetchUsers = () => {
    axiosInstance
      .get("/api/users") // Adjust endpoint as needed
      .then((response) => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        // Filter out current user from the list
        const filteredUsers = response.data.filter(u => u._id !== currentUser._id);
        setUsers(filteredUsers);
      })
      .catch((error) => {
        console.error("Error fetching users:", error);
      });
  };

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
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, isRead: true } : n
          )
        );
        
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
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true }))
        );
        
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

  // Handle user selection for private polls
  const handleUserSelect = (selectedUser) => {
    if (!selectedUsers.find(user => user._id === selectedUser._id)) {
      setSelectedUsers([...selectedUsers, selectedUser]);
    }
    setUserSearchTerm("");
    setShowUserDropdown(false);
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user._id !== userId));
  };

  const filteredUsers = users.filter(user =>
    user.fullname.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  const openCreatePollDialog = () => {
    setShowCreatePollDialog(true);
  };

  const closeCreatePollDialog = () => {
    setPollQuestion("");
    setPollOptions(["", ""]);
    setVisibility("public");
    setDuration("");
    setDurationUnit("minutes");
    setSelectedUsers([]);
    setUserSearchTerm("");
    setShowCreatePollDialog(false);
  };

const createPoll = () => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Validation
  if (!pollQuestion.trim()) {
    toast.error("Please enter a poll question");
    return;
  }

  if (pollOptions.some(option => !option.trim())) {
    toast.error("Please fill in all poll options");
    return;
  }

  if (!duration || duration <= 0) {
    toast.error("Please enter a valid duration");
    return;
  }

  if (visibility === "private" && selectedUsers.length === 0) {
    toast.error("Please select at least one user for private poll");
    return;
  }

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
    allowedUsers: visibility === "private" ? selectedUsers.map(user => user._id) : [],
  };

  axiosInstance
    .post("/api/polls", postData)
    .then((response) => {
      if (response.status === 201) {
        closeCreatePollDialog();
        toast.success("Poll created Successfully");

        // Only send notification for public polls
        if (visibility === "public") {
          axiosInstance
            .post("/notifications", {
              content: `${currentUser.fullname} created a new poll: ${pollQuestion}`,
              poll: response.data.poll._id,  // Use 'poll' key if your backend expects it
              userId: currentUser._id // or omit if backend handles recipient
            })
            .then(() => {
              console.log("Notification created successfully");
            })
            .catch((error) => {
              console.error("Error creating notification:", error);
            });
        }

        socketRef.current.emit("newPollCreated", response.data.poll); // Emit the created poll from response
      }
    })
    .catch((error) => {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll");
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
    if (a.isRead !== b.isRead) {
      return a.isRead ? 1 : -1;
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  return (
  <div className="navbar">
    <div className="navbar-left">
      <h3>Polling Application</h3>
      <button className="toggle-sidebar-button" onClick={toggleSidebar}>
        <i className="fas fa-bars"></i>
      </button>
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
        </div>
      )}

      <Modal
        title="Create Poll"
        open={showCreatePollDialog}
        onOk={createPoll}
        onCancel={closeCreatePollDialog}
        width={1200}
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
                  checked={visibility === "public"}
                  onChange={() => {
                    setVisibility("public");
                    setSelectedUsers([]);
                  }}
                  id="public"
                  name="visibility"
                  type="radio"
                  value="public"
                  required
                  className="radio-center"
                />
                <label htmlFor="public">Public</label>
              </div>
              <div className="visibility-options">
                <input
                  checked={visibility === "private"}
                  onChange={() => {
                    setVisibility("private");
                    setSelectedUsers([]);
                  }}
                  id="private"
                  name="visibility"
                  type="radio"
                  value="private"
                  required
                  className="radio-center"
                />
                <label htmlFor="private">Private</label>
              </div>


              {/* User selection for private polls */}
              {visibility === "private" && (
                <div className="user-selection-container">
                  <label htmlFor="allowedUsers">Select Users:</label>
                  <div className="user-search-container" ref={userDropdownRef}>
                    <input
                      type="text"
                      placeholder="Search users by name or email..."
                      value={userSearchTerm}
                      onChange={(e) => {
                        setUserSearchTerm(e.target.value);
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                      className="user-search-input"
                    />
                    
                    {showUserDropdown && userSearchTerm && (
                      <div className="user-dropdown">
                        {filteredUsers.length > 0 ? (
                          filteredUsers.slice(0, 10).map((user) => (
                            <div
                              key={user._id}
                              className="user-option"
                              onClick={() => handleUserSelect(user)}
                            >
                              <div className="user-info">
                                <span className="user-name">{user.fullname}</span>
                                <span className="user-email">{user.email}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="no-users-found">No users found</div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Display selected users */}
                  {selectedUsers.length > 0 && (
                    <div className="selected-users-container">
                      <label>Selected Users:</label>
                      <div className="selected-users-list">
                        {selectedUsers.map((user) => (
                          <div key={user._id} className="selected-user-tag">
                            <span className="selected-user-name">{user.fullname}</span>
                            <button
                              type="button"
                              className="remove-user-btn"
                              onClick={() => removeSelectedUser(user._id)}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Navbar;