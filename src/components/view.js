import React, { useState, useEffect } from "react";
import "./view.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/FlashMind-Logo.png";
import { LuSparkles } from "react-icons/lu";
import { AiOutlineEdit } from "react-icons/ai";
import { BsFillVolumeUpFill } from "react-icons/bs";

function View() {
  const navigate = useNavigate();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [title, setTitle] = useState("FlashMind Title");
  const [editing, setEditing] = useState(false);
  const [currentTerm, setCurrentTerm] = useState("");
  const [currentDefinition, setCurrentDefinition] = useState("");

  useEffect(() => {
    const savedFlashcards = JSON.parse(localStorage.getItem("flashcards")) || [];
    if (savedFlashcards.length > 0) {
      setFlashcards(savedFlashcards);
    }
    setTitle(localStorage.getItem("flashcardTitle") || "Untitled Flashcard");

    // Clear flashcards after they are loaded
    localStorage.removeItem("flashcards");
    localStorage.removeItem("flashcardTitle");

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  useEffect(() => {
    if (flashcards.length > 0) {
      setCurrentTerm(flashcards[currentIndex].term);
      setCurrentDefinition(flashcards[currentIndex].definition);
    }
  }, [flashcards, currentIndex]);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false); // Reset flip state before updating index
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false); // Reset flip state before updating index
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  const getFontSize = (text) => {
    if (text.length < 20) return "32px";
    if (text.length < 40) return "28px";
    if (text.length < 60) return "24px";
    return "20px";
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleSave = () => {
    const updatedFlashcards = [...flashcards];
    updatedFlashcards[currentIndex].term = currentTerm;
    updatedFlashcards[currentIndex].definition = currentDefinition;
    setFlashcards(updatedFlashcards);
    localStorage.setItem("flashcards", JSON.stringify(updatedFlashcards));
    setEditing(false);
  };

  const handleSpeech = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechClick = (e) => {
    e.stopPropagation(); // Prevent triggering flip when clicking on the icon
    const text = currentDefinition || currentTerm;
    handleSpeech(text);
  };

  // Conditionally flip only if not in edit mode
  const handleCardClick = () => {
    if (!editing) {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div className="container">
      <header className="header">
        <img
          src={logo}
          alt="FlashMind Logo"
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        />
        <button className="create-btn" onClick={() => navigate("/generate")}>
          <LuSparkles /> Generate Flashcard
        </button>
      </header>

      <div className="view">
        <h2 className="flashcard-title">{title}</h2>

        {flashcards.length > 0 ? (
          <div className="flashcard-container">
            <div
              key={currentIndex} // Forces re-render when index changes
              className={`flashcard ${isFlipped ? "flipped" : ""}`}
              onClick={handleCardClick} // Only flip if not editing
            >
              <div className="flashcard-icons">
                <AiOutlineEdit
                  className="edit-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit();
                  }}
                />
                <BsFillVolumeUpFill
                  className="speech-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSpeechClick(e);
                  }}
                />
              </div>

              <div className="front" style={{ fontSize: getFontSize(currentTerm) }}>
                {editing ? (
                  <input
                    type="text"
                    value={currentTerm}
                    onChange={(e) => setCurrentTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                ) : (
                  currentTerm
                )}
              </div>
              <div className="back" style={{ fontSize: getFontSize(currentDefinition) }}>
                {editing ? (
                  <textarea
                    value={currentDefinition}
                    onChange={(e) => setCurrentDefinition(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSave();
                      }
                    }}
                  />
                ) : (
                  currentDefinition
                )}
              </div>

              {editing && (
                <button className="save-btn" onClick={handleSave}>
                  Save
                </button>
              )}
            </div>

            <div className="navigation">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className={currentIndex === 0 ? "disabled-btn" : "active-btn"}
              >
                ❮
              </button>
              <span>
                {currentIndex + 1} / {flashcards.length}
              </span>
              <button
                onClick={handleNext}
                disabled={currentIndex === flashcards.length - 1}
                className={
                  currentIndex === flashcards.length - 1 ? "disabled-btn" : "active-btn"
                }
              >
                ❯
              </button>
            </div>
          </div>
        ) : (
          <p>No flashcards available.</p>
        )}
      </div>
    </div>
  );
}

export default View;
