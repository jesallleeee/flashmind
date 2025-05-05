import React, { useState, useRef } from "react";
import "./generate.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/FlashMind-Logo.png";
import { LuPencil } from "react-icons/lu";
import { FaUpload, FaArrowRight, FaMicrophone} from "react-icons/fa";
import { MdDeleteSweep } from "react-icons/md";

function Generate() {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleClearInput = () => {
    setInputText("");
    setUploadedFile(null);      
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const handleSubmit = () => {
    if (!inputText.trim() && !uploadedFile) {
      alert("Please insert notes to generate flashcards.");
      return;
    }
    setIsLoading(true);
    navigate("/view", { state: { inputText, uploadedFile } });
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
          tabIndex="0"
          aria-label="Go to homepage"
        />
        <button
          className="create-btn"
          onClick={() => navigate("/create")}
          tabIndex="0"
          aria-label="Create a new flashcard"
        >
          <LuPencil /> Create Flashcard
        </button>
      </header>

      <div className="generate">
        <div className="generate-container">
          <h2 className="title-generate">Generate Flashcards</h2>
          <button
            className="clear-btn-generate"
            onClick={handleClearInput}
            tabIndex="0"
            aria-label="Clear input"
          >
            <MdDeleteSweep />
          </button>
        </div>

        <div className="input-box">
          <textarea
            placeholder="Insert notes to generate flashcards..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            tabIndex="0"
          />
          <div className="input-buttons">
            <div className="button-group">
              <label className="upload-btn" tabIndex="0">
                <FaUpload /> Upload File
              </label>  
              <button className="mic-btn" disabled tabIndex="0" aria-label="Voice input (coming soon)">
                <FaMicrophone />
              </button>
            </div>
            <div className="submit-container">
              <button className="submit-btn" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "Loading..." : <FaArrowRight />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Generate;