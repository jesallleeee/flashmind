import React, { useState, useEffect } from "react";
import "./view.css";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "../assets/FlashMind-Logo.png";
import { LuSparkles } from "react-icons/lu";
import { AiOutlineEdit } from "react-icons/ai";
import { BsFillVolumeUpFill } from "react-icons/bs";
import { FaPlay, FaPause } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import html2pdf from "html2pdf.js";

function View() {
  const navigate = useNavigate();
  const location = useLocation();
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [title, setTitle] = useState("FlashMind Title");
  const [editing, setEditing] = useState(false);
  const [currentTerm, setCurrentTerm] = useState("");
  const [currentDefinition, setCurrentDefinition] = useState("");
  const [autoFlip, setAutoFlip] = useState(false);

  useEffect(() => {
    const storedFlashcards = location.state?.flashcards || JSON.parse(localStorage.getItem("flashcards")) || [];
    const storedTitle = location.state?.title || localStorage.getItem("flashcardTitle") || "FlashMind Title";

    setFlashcards(storedFlashcards);
    setTitle(storedTitle);

    if (location.state?.flashcards) {
      localStorage.setItem("flashcards", JSON.stringify(location.state.flashcards));
    }
    if (location.state?.title) {
      localStorage.setItem("flashcardTitle", location.state.title);
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
      window.speechSynthesis.cancel();
    };
  }, [location.state]);

  useEffect(() => {
    if (flashcards.length > 0) {
      setCurrentTerm(flashcards[currentIndex].term);
      setCurrentDefinition(flashcards[currentIndex].definition);
    }
  }, [flashcards, currentIndex]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  useEffect(() => {
    let flipTimeout;

    const startAutoFlip = () => {
      flipTimeout = setTimeout(() => {
        setIsFlipped((prev) => {
          const flipped = !prev;

          // After showing definition, go to next card
          if (flipped) {
            // Shorter time for definition (e.g. 3s)
            flipTimeout = setTimeout(() => {
              setIsFlipped(false); // Flip back to term
              setCurrentIndex((prev) => {
                if (prev < flashcards.length - 1) return prev + 1;
                return 0; // Restart at first card
              });
            }, 3000); // 3s for definition
          }

          return flipped;
        });
      }, 6000); // 6s for term
    };

    if (autoFlip) {
      startAutoFlip();
    }

    return () => clearTimeout(flipTimeout);
  }, [autoFlip, currentIndex, flashcards.length]);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setIsFlipped(false);
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
    window.speechSynthesis.cancel(); // Cancel before speaking
    window.speechSynthesis.speak(utterance);
  };

  const handleSpeechClick = (e) => {
    e.stopPropagation();
    const text = isFlipped ? currentDefinition : currentTerm;
    handleSpeech(text);
  };

  const handleCardClick = () => {
    if (!editing) {
      setIsFlipped(!isFlipped);
    }
  };

  const exportFlashcards = (format = "json") => {
    const data = flashcards.map((card) => ({
      term: card.term,
      definition: card.definition
    }));

    const content = format === "json"
      ? JSON.stringify(data, null, 2)
      : data.map(card => `${card.term}: ${card.definition}`).join("\n");

    const blob = new Blob([content], {
      type: format === "json" ? "application/json" : "text/plain"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `flashcards.${format}`;
    link.click();
  };

  const handleExportPDF = () => {
    const container = document.createElement("div");

    flashcards.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.style.marginBottom = "20px";
      cardElement.style.fontFamily = "Montserrat, sans-serif";
      cardElement.innerHTML = `
        <h3 style="margin-bottom: 8px; color: #4CAF50;">${index + 1}. Term</h3>
        <p style="margin-bottom: 12px; font-size: 16px;">${card.term}</p>
        <h4 style="margin-bottom: 8px; color: #FF9800;">Definition</h4>
        <p style="font-size: 15px;">${card.definition}</p>
        <hr style="margin: 20px 0;" />
      `;
      container.appendChild(cardElement);
    });

    html2pdf()
      .set({
        margin: 10,
        filename: `${title.replace(/\s+/g, "_")}_Flashcards.pdf`,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(container)
      .save();
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
        <button
          className="create-btn"
          onClick={() => {
            const confirmReset = window.confirm("Generate new flashcards? This will discard current flashcards.");
            if (confirmReset) {
              localStorage.removeItem("flashcards");
              localStorage.removeItem("flashcardTitle");
              navigate("/generate");
            }
          }}
        >
          <LuSparkles /> Generate Flashcard
        </button>
      </header>

      <div className="view">
        <h2 className="flashcard-title">{title}</h2>

        {flashcards.length > 0 ? (
          <div className="flashcard-container">
            <div
              key={currentIndex}
              className={`flashcard ${isFlipped ? "flipped" : ""} ${editing ? "editing" : ""}`}
              onClick={handleCardClick}
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
                <span
                  className="auto-flip-icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoFlip(!autoFlip);
                  }}
                  title={autoFlip ? "Stop Auto-Flip" : "Start Auto-Flip"}
                >
                  {autoFlip ? <FaPause /> : <FaPlay />}
                </span>
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

            <div className="navigation-grid">
              <div></div> {/* Empty left cell (can be used later if needed) */}

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
                  className={currentIndex === flashcards.length - 1 ? "disabled-btn" : "active-btn"}
                >
                  ❯
                </button>
              </div>

              <div className="export-wrapper">
                <button className="export-btn" onClick={handleExportPDF}>
                  <FiDownload className="export-icon" />
                  Export Flashcards
                </button>
              </div>
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