// src/components/PollDetails.jsx

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosinstance";
import { formatRemainingTime, calculateRemainingTime } from "../timeutils/timeutils";
import { toast } from "react-toastify";
import "./PollDetails.css"; // optional

const PollDetails = () => {
  const { id: pollId } = useParams();
  const navigate = useNavigate();

  const [poll, setPoll] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isVoting, setIsVoting] = useState(false);

  const pollIsExpired = countdown <= 0;
  const shouldShowRedBackground = countdown !== "N/A" && countdown <= 300;

  // Get current user
  const getCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      return user?._id || null;
    } catch (error) {
      console.error("Error getting current user:", error);
      return null;
    }
  };

  const fetchPollDetails = useCallback(async () => {
    try {
      const response = await axiosInstance.get(`/api/polls/${pollId}`);
      if (response.status === 200) {
        setPoll(response.data);
        
        // Check if user has already voted (from localStorage or backend)
        const userId = getCurrentUser();
        if (userId) {
          const cachedVoteStatus = localStorage.getItem(`hasVoted_${userId}_${pollId}`);
          const cachedSelectedOption = localStorage.getItem(`selectedOption_${userId}_${pollId}`);
          
          if (cachedVoteStatus === 'true') {
            setHasVoted(true);
            if (cachedSelectedOption) {
              setSelectedOption(cachedSelectedOption);
            }
          } else {
            // Check with backend if not cached
            checkUserVoteStatus();
          }
        }
      }
    } catch (error) {
      console.error("Error fetching poll details:", error);
    }
  }, [pollId]);

  const checkUserVoteStatus = async () => {
    try {
      const response = await axiosInstance.get(`/api/vote/user/${pollId}`);
      if (response.data.hasVoted) {
        setHasVoted(true);
        const userId = getCurrentUser();
        if (userId) {
          localStorage.setItem(`hasVoted_${userId}_${pollId}`, 'true');
          
          // If the backend returns the user's selected option, store it
          if (response.data.selectedOption) {
            setSelectedOption(response.data.selectedOption);
            localStorage.setItem(`selectedOption_${userId}_${pollId}`, response.data.selectedOption);
          }
        }
      }
    } catch (error) {
      console.error("Error checking vote status:", error);
    }
  };

  const voteOption = async (option) => {
    if (pollIsExpired) {
      alert("This poll has ended, and no more votes can be cast.");
      return;
    }

    const userId = getCurrentUser();
    if (!userId) {
      toast.error("User not found. Please log in again.");
      return;
    }

    // Check both state and localStorage with user-specific key
    if (hasVoted || localStorage.getItem(`hasVoted_${userId}_${pollId}`) === 'true') {
      toast.error("You have already voted in this poll.");
      return;
    }

    if (isVoting) return;

    setIsVoting(true);

    try {
      const response = await axiosInstance.post("/api/vote", {
        pollId,
        optionId: option._id,
      });

      if (response.status === 200) {
        setSelectedOption(option.option);
        setHasVoted(true);
        // Store both vote status and selected option with user-specific keys
        localStorage.setItem(`hasVoted_${userId}_${pollId}`, "true");
        localStorage.setItem(`selectedOption_${userId}_${pollId}`, option.option);
        toast.success("Voted Successfully");
        setTimeout(() => navigate("/dashboard"), 2000);
      }
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error("You have already voted in this poll.");
        // Cache the vote status even if it comes from backend error
        localStorage.setItem(`hasVoted_${userId}_${pollId}`, "true");
        setHasVoted(true);
        setTimeout(() => navigate("/dashboard"), 2000);
      } else {
        toast.error("Failed to vote. Please try again.");
        console.error("Vote error:", error);
      }
    } finally {
      setIsVoting(false);
    }
  };

  const calculatePercentage = (option) => {
    const totalVotes = poll?.options.reduce((acc, opt) => acc + opt.votes, 0);
    const votes = poll?.options.find((o) => o.option === option)?.votes || 0;
    return totalVotes > 0 ? ((votes / totalVotes) * 100).toFixed(2) : 0;
  };

  useEffect(() => {
    fetchPollDetails();
  }, [fetchPollDetails]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (poll) {
        const remaining = calculateRemainingTime(poll);
        setCountdown(remaining);
        if (remaining <= 0) {
          localStorage.setItem(`redBackground_${pollId}`, "true");
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [poll, pollId]);

  return (
    <div className="poll-details-container">
      {poll ? (
        <div className="poll-card">
          <div className={`time-left ${shouldShowRedBackground ? "red-background" : ""}`}>
            <span className="label">Time Left: </span>
            {formatRemainingTime(countdown)}
          </div>
          <h2>Poll Details</h2>
          <h3>{poll.question}?</h3>

          <ul className="options-list">
            {poll.options.map((option, index) => (
              <li key={index} onClick={() => voteOption(option)}>
                <label>
                  <div
                    className={`option-container ${
                      selectedOption === option.option ? "selected-option" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      value={option.option}
                      checked={selectedOption === option.option}
                      onChange={() => setSelectedOption(option.option)}
                      disabled={hasVoted}
                      className="radio-button"
                    />
                    <div className="option-text">{option.option}</div>
                    {hasVoted && poll.totalVotes > 0 && (
                      <div className="vote-percentage">
                        {calculatePercentage(option.option)}%
                      </div>
                    )}
                  </div>
                </label>
              </li>
            ))}
          </ul>
          <hr />
        </div>
      ) : (
        <p>Loading...</p>
      )}

      <button onClick={() => navigate("/dashboard")} className="back-button">
        Back to Dashboard
      </button>
    </div>
  );
};

export default PollDetails;