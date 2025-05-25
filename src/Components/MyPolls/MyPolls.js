import React, { useState, useEffect,useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from "../Navbar/Navbar";
import axiosInstance from "../../utils/axiosinstance";
import Swal from "sweetalert2";
import { calculateRemainingTime, formatRemainingTime } from "../timeutils/timeutils";
import './MyPolls.css';

  const MyPolls = () => {
  const [polls, setPolls] = useState([]);
  const [selectedPoll, setSelectedPoll] = useState(null);
  const [showQuestions, setShowQuestions] = useState(true);


  useEffect(() => {
    fetchUserPolls();
    const interval = setInterval(updateRemainingTime, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (selectedPoll) {
      const selectedPollInterval = setInterval(() => {
        setSelectedPoll(prevPoll => {
          if (!prevPoll) return null;
          
          return {
            ...prevPoll,
            timeLeft: formatRemainingTime(
              calculateRemainingTime(prevPoll),
              prevPoll.durationUnit
            )
          };
        });
      }, 1000);
      
      return () => clearInterval(selectedPollInterval);
    }
  }, [selectedPoll?._id]); // Only re-run if the selected poll changes

  const fetchUserPolls = async () => {
    try {
      const response = await axiosInstance.get("http://localhost:3000/api/user/polls");

      if (response.status === 200) {
        setPolls(response.data);
        updateRemainingTime();
      } else {
        console.error(
          "Failed to fetch user's polls:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error fetching user's polls:", error);
    }
  };

  const deletePoll = async (pollId) => {
    try {
      const response = await axiosInstance.delete(`/api/polls/${pollId}`);

      if (response.status === 200) {
        setPolls(polls.filter((poll) => poll._id !== pollId));
        setSelectedPoll(null);
      } else {
        console.error(
          "Failed to delete poll:",
          response.status,
          response.statusText
        );
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
    }
  };

  const confirmDelete = async (pollId, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Deleting this poll will permanently remove it along with all associated information. Are you sure you want to proceed?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      deletePoll(pollId);
    }
  };

  const updateRemainingTime = () => {
    setPolls(currentPolls => 
      currentPolls.map(poll => ({
        ...poll,
        timeLeft: formatRemainingTime(
          calculateRemainingTime(poll),
          poll.durationUnit
        )
      }))
    );
  };
  const pollDetailsRef = useRef(null);

  const showPollDetails = (poll) => {
    const totalVotes = poll.options.reduce(
      (total, option) => total + option.votes,
      0
    );

    const updatedOptions = poll.options.map((option) => ({
      ...option,
      votePercentage:
        totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0,
    }));

    setSelectedPoll({
      ...poll,
      totalVotes,
      options: updatedOptions
    });
    setTimeout(() => {
    if (pollDetailsRef.current) {
      pollDetailsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, 100);
  };

  const getTimeLeftColor = () => {
    if (selectedPoll && selectedPoll.timeLeft === 'Expired') {
      return "red";
    }
    return selectedPoll && selectedPoll.timeLeft < 300 ? "red" : "green";
  };

  return (
    <div className="my-polls">
      <Navbar />
      <button
  className="toggle-btn"
  onClick={() => setShowQuestions((prev) => !prev)}
>
  {showQuestions ? 'Hide Poll Titles' : 'Show Poll Titles'}
</button>

      <div className="my-polls-container">
{showQuestions && (
    <div className="question-list">
      <h2 className="my-polls-title">Poll Title</h2>
      <ul>
        {polls.map((poll, index) => (
          <li key={index} onClick={() => showPollDetails(poll)}>
            {poll.question}
            <span onClick={(e) => confirmDelete(poll._id, e)} className="delete-icon">
              <i className="fa-solid fa-trash" style={{ color: "#ff0000" }}></i>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )}

        <div className="poll-details" ref={pollDetailsRef}>
          <h2 className="my-polls-title">Poll Details</h2>
          
          {selectedPoll ? (
            <div className="poll-card">
              <div className="poll-card-header">
                <h2>{selectedPoll.question}</h2>
                <div className="poll-card-stats">
                  <span className="poll-card-stat">
                    Total Votes: {selectedPoll.totalVotes}
                  </span>
                  <br />
                  <span className="time-left" style={{ color: getTimeLeftColor() }}>
                    Time Left: {selectedPoll.timeLeft}
                  </span>
                </div>
              </div>

              <div className="poll-card-options">
                <ul className="bullet-list">
                  {selectedPoll.options.map((option, optionIndex) => (
                    <li key={optionIndex}>
                      <div className="option-slider">
                        <div className="option-text">{option.option}</div>
                        <div className="option-percent">
                          {option.votePercentage.toFixed(2)}%
                        </div>
                        <div className="vote-bar">
                          <div
                            style={{ width: `${option.votePercentage}%` }}
                            className="vote-fill"
                          ></div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <p>Please select a poll to view details.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyPolls;