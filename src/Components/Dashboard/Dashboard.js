import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../Navbar/Navbar";
import {
  calculateRemainingTime,
  formatRemainingTime,
} from "../timeutils/timeutils";
import axiosInstance from "../../utils/axiosinstance";
import "./Dashboard.css";

const Dashboard = () => {
  const [polls, setPolls] = useState([]);
  const [remainingTimes, setRemainingTimes] = useState({});
  const [userHasVoted, setUserHasVoted] = useState({});
  const [userSelectedOptions, setUserSelectedOptions] = useState({});
  const [intervals, setIntervals] = useState({});
  const [currentFilter, setCurrentFilter] = useState("live");
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'voted'


  useEffect(() => {
    fetchPolls();
    return () => {
      // Clear intervals on unmount
      Object.keys(intervals).forEach((pollId) => clearInterval(intervals[pollId]));
    };
  }, []);

  const fetchPolls = async () => {
    try {
      const res = await axiosInstance.get("http://localhost:3000/api/polls");
      const user = JSON.parse(localStorage.getItem("user"));
      const filteredPolls = res.data.filter((poll) => poll.createdBy.userId !== user._id);
      setPolls(filteredPolls);
      startCountdownTimers(filteredPolls);
      filteredPolls.forEach((poll) => checkUserVoteForPoll(poll._id));
    } catch (error) {
      console.error("Error fetching polls:", error);
    }
  };

  const checkUserVoteForPoll = async (pollId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user._id;
    
    // Check localStorage first for vote status and selected option
    const cachedVoteStatus = localStorage.getItem(`hasVoted_${userId}_${pollId}`);
    const cachedSelectedOption = localStorage.getItem(`selectedOption_${userId}_${pollId}`);
    
    if (cachedVoteStatus === 'true') {
      setUserHasVoted((prev) => ({ ...prev, [pollId]: true }));
      if (cachedSelectedOption) {
        setUserSelectedOptions((prev) => ({ ...prev, [pollId]: cachedSelectedOption }));
      }
      return;
    }

    // Otherwise, check with the backend if not cached
    try {
      const res = await axiosInstance.get(`/api/vote/user/${pollId}`);
      setUserHasVoted((prev) => ({ ...prev, [pollId]: res.data.hasVoted }));
      
      if (res.data.hasVoted) {
        // Cache the vote status
        localStorage.setItem(`hasVoted_${userId}_${pollId}`, 'true');
        
        // If backend returns selected option, cache and set it
        if (res.data.selectedOption) {
          localStorage.setItem(`selectedOption_${userId}_${pollId}`, res.data.selectedOption);
          setUserSelectedOptions((prev) => ({ ...prev, [pollId]: res.data.selectedOption }));
        }
      }
    } catch (error) {
      console.error("Error checking user vote:", error);
    }
  };

  const updatePollStatus = async (pollId) => {
    try {
      await axiosInstance.patch(
        `http://localhost:3000/api/polls/update-status/${pollId}`,
        { isOpen: false },
        { headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("Error updating poll status:", error);
    }
  };

  const startCountdownTimers = (pollList) => {
    pollList.forEach((poll) => {
      const remaining = calculateRemainingTime(poll);
      if (remaining !== "N/A") {
        if (remaining <= 0) {
          setRemainingTimes((prev) => ({ ...prev, [poll._id]: 0 }));
          updatePollStatus(poll._id);
          localStorage.setItem(`remainingTime${poll._id}`, "0");
        } else {
          setRemainingTimes((prev) => ({ ...prev, [poll._id]: remaining }));
          const timer = setInterval(() => {
            const newRemaining = calculateRemainingTime(poll);
            if (newRemaining <= 0) {
              clearInterval(timer);
              setRemainingTimes((prev) => ({ ...prev, [poll._id]: 0 }));
              updatePollStatus(poll._id);
              localStorage.setItem(`remainingTime${poll._id}`, "0");
            } else {
              setRemainingTimes((prev) => ({ ...prev, [poll._id]: newRemaining }));
            }
          }, 1000);
          setIntervals((prev) => ({ ...prev, [poll._id]: timer }));
        }
      }
    });
  };

  const shouldShowRedBackground = (pollId) => {
    const remaining = remainingTimes[pollId];
    return typeof remaining === 'number' && remaining <= 300 && remaining > 0;
  };

  const pollIsExpired = (pollId) => {
    const remaining = remainingTimes[pollId];
    return remaining === 0 || remaining === "Expired";
  };

const filteredPolls = polls.filter((poll) => {
  const hasVoted = userHasVoted[poll._id];
  const isExpired = pollIsExpired(poll._id);
  const isLive = poll.isOpen && !isExpired;

  // Filter by activeTab
  if (activeTab === "active" && hasVoted) return false;
  if (activeTab === "voted" && !hasVoted) return false;

  // Filter by currentFilter
  if (currentFilter === "live" && !isLive) return false;
  if (currentFilter === "expired" && !isExpired) return false;
  if (currentFilter === "all") return true;

  return true;
});



  return (
    <div className="dashboard">
      <Navbar />
      <div className="poll-tab-buttons">
  <button
    className={activeTab === "active" ? "tab-button active" : "tab-button"}
    onClick={() => setActiveTab("active")}
  >
    Active Polls
  </button>
  <button
    className={activeTab === "voted" ? "tab-button active" : "tab-button"}
    onClick={() => setActiveTab("voted")}
  >
    Already Voted
  </button>
</div>

      <div className="filter-buttons">
        <div className="filter-button-group">
          <label htmlFor="sortSelect">Sort by:</label>
          <select
            value={currentFilter}
            onChange={(e) => setCurrentFilter(e.target.value)}
            id="sortSelect"
            className="sort-by-dropdown"
          >
            <option value="live">Live Polls</option>
            <option value="expired">Expired Polls</option>
            <option value="all">Show All</option>
          </select>
        </div>
      </div>
      {filteredPolls.length === 0 ? (
        <p>No polls available</p>
      ) : (
        <div className="poll-cards-container">
          {filteredPolls.map((poll, index) => (
            <div key={index} className="poll-card">
              <div
                className={`time-left ${
                  shouldShowRedBackground(poll._id) 
                    ? "red-background" 
                    : pollIsExpired(poll._id) 
                    ? "expired-background" 
                    : ""
                }`}
              >
                <span className="label">Time Left: </span>
                {!pollIsExpired(poll._id) ? (
                  <span>{formatRemainingTime(remainingTimes[poll._id], poll.durationUnit)}</span>
                ) : (
                  <span>Expired</span>
                )}
              </div>
              <h2>{poll.question}?</h2>
              {poll.createdBy && (
                <p className="created-by-bottom-right">Created by: {poll.createdBy.username}</p>
              )}
              <ul className="bullet-list">
                {poll.options.map((option, i) => (
                  <li 
                    key={i} 
                    className={
                      userHasVoted[poll._id] && userSelectedOptions[poll._id] === option.option 
                        ? "selected-option-dashboard" 
                        : ""
                    }
                  >
                    {option.option}
                    {userHasVoted[poll._id] && userSelectedOptions[poll._id] === option.option && (
                      <span className="your-choice-indicator"> ✓ Your Choice</span>
                    )}
                  </li>
                ))}
              </ul>
              {!pollIsExpired(poll._id) ? (
                userHasVoted[poll._id] ? (
                  <span className="poll-voted-message">
                    You have already voted in this poll
                  </span>
                ) : (
                  <Link to={`/poll/${poll._id}`} className="access-link">
                    Access Live Poll
                  </Link>
                )
              ) : (
                <span className="poll-ended-message">Poll Duration Ended</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;