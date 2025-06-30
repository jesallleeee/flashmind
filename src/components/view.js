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
import axios from "axios";

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
  const [progress, setProgress] = useState(0);
  const [imagesFetched, setImagesFetched] = useState(false);

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

    const calculateDisplayTime = (text) => {
      const words = text.trim().split(/\s+/).length;
      return Math.min(10000, 2000 + words * 300); // Max 10s, base 2s + 300ms per word
    };

    const autoFlipCards = () => {
      if (!autoFlip || flashcards.length === 0) return;

      const showTermTime = calculateDisplayTime(flashcards[currentIndex].term);
      const showDefTime = calculateDisplayTime(flashcards[currentIndex].definition);

      setIsFlipped(false);
      flipTimeout = setTimeout(() => {
        setIsFlipped(true);

        flipTimeout = setTimeout(() => {
          if (currentIndex < flashcards.length - 1) {
            setCurrentIndex((prevIndex) => prevIndex + 1);
          } else {
            setAutoFlip(false); // Stop auto-flip at the last card
          }
        }, showDefTime);
      }, showTermTime);
    };

    autoFlipCards();

    return () => clearTimeout(flipTimeout);
  }, [autoFlip, currentIndex, flashcards]);

  useEffect(() => {
    if (flashcards.length > 0) {
      setProgress(((currentIndex + 1) / flashcards.length) * 100);
    } else {
      setProgress(0);
    }
  }, [currentIndex, flashcards.length]);

  useEffect(() => {
    const enrichFlashcardsWithImages = async () => {
      const enriched = await Promise.all(
        flashcards.map(async (card) => {
          if (!card.image) {
            const imageUrl = await fetchImageForTerm(card.term, card.definition);
            return { ...card, image: imageUrl };
          }
          return card;
        })
      );

      setFlashcards(enriched);
      setImagesFetched(true); // ✅ prevent reruns
    };

    if (flashcards.length > 0 && !imagesFetched) {
      enrichFlashcardsWithImages();
    }
  }, [flashcards, imagesFetched]); // ✅ depend on the flag

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

  const handleExportPDF = () => {
    const container = document.createElement("div");

    flashcards.forEach((card, index) => {
      const cardElement = document.createElement("div");
      cardElement.style.marginBottom = "20px";
      cardElement.style.fontFamily = "Montserrat, sans-serif";

      const termHTML = `
        <h3 style="margin-bottom: 8px; color: #4CAF50;">${index + 1}. Term</h3>
        <p style="margin-bottom: 12px; font-size: 16px;">${card.term}</p>
      `;

      const imageHTML = card.image
        ? `<img src="${card.image}" alt="Image for ${card.term}" style="max-width: 150px; max-height: 100px; margin: 10px 0; border-radius: 8px; object-fit: cover;" />`
        : "";

      const defHTML = `
        <h4 style="margin-bottom: 8px; color: #FF9800;">Definition</h4>
        <p style="font-size: 15px;">${card.definition}</p>
        <hr style="margin: 20px 0;" />
      `;

      cardElement.innerHTML = termHTML + imageHTML + defHTML;
      container.appendChild(cardElement);
    });

    html2pdf()
    .set({
      margin: 10,
      filename: `${title.replace(/\s+/g, "_")}_Flashcards.pdf`,
      html2canvas: {
        scale: 2,
        useCORS: true,
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    })
    .from(container)
    .save();
  };

  const handleLogoClick = () => {
    localStorage.removeItem("flashcards");
    localStorage.removeItem("flashcardTitle");
    navigate("/");
  };

  const fetchImageForTerm = async (term) => {
    try {
      const refinedQuery = `${term} ${currentDefinition.split(" ").slice(0, 5).join(" ")}`; // top 5 words from definition

      const response = await axios.get("https://api.pexels.com/v1/search", {
        headers: {
          Authorization: "9KWUnDAegGBhoFNob0aLntDMXWMDVNxY7ehcRmnd9Iiw2M9inEIHYff2",
        },
        params: {
          query: refinedQuery,
          per_page: 5,
          orientation: "landscape",
        },
      });

      const photos = response.data.photos;
      return photos.length > 0 ? photos[0].src.medium : "";
    } catch (error) {
      console.error("Pexels image fetch error:", error);
      return "";
    }
  };

  return (
    <div className="container">
      <header className="header">
        <img
          src={logo}
          alt="FlashMind Logo"
          className="logo"
          onClick={handleLogoClick}
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
        <div className="progress-bar-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

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
                <div className="term-with-image">
                  {flashcards[currentIndex]?.image && (
                    <img
                      src={flashcards[currentIndex].image}
                      alt="Flashcard visual"
                      className="flashcard-image"
                    />
                  )}
                  <p>{currentTerm}</p>
                </div>
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