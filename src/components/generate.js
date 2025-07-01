  import React, { useState, useRef, useEffect } from "react";
  import "./generate.css";
  import { useNavigate } from "react-router-dom";
  import logo from "../assets/FlashMind-Logo.png";
  import { LuPencil } from "react-icons/lu";
  import { FaUpload, FaArrowRight, FaMicrophone } from "react-icons/fa";
  import { MdDeleteSweep } from "react-icons/md";
  import Lottie from "lottie-react";
  import loaderAnimation from "../assets/loader.json";

  function Generate() {
    const navigate = useNavigate();
    const [inputText, setInputText] = useState("");
    const [uploadedFile, setUploadedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);
    const finalTranscriptRef = useRef("");
    const [generatedFlashcards, setGeneratedFlashcards] = useState([]);
    const [generatedTitle, setGeneratedTitle] = useState("");

    useEffect(() => {
    localStorage.removeItem("flashcards");
    localStorage.removeItem("flashcardTitle");

    const savedText = localStorage.getItem("flashmind_inputText");
    if (savedText) {
      setInputText(savedText);
    }
  }, []);

    useEffect(() => {
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }

        // Clear inputs when navigating away
        setInputText("");
        setUploadedFile(null);
        localStorage.removeItem("flashmind_inputText");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };
    }, []);

    const handleClearInput = () => {
      const confirmed = window.confirm("Are you sure you want to clear the input?");
      if (!confirmed) return;

      if (recognitionRef.current && isRecording) {
        recognitionRef.current.stop();
      }

      setInputText("");
      setUploadedFile(null);
      finalTranscriptRef.current = "";
      localStorage.removeItem("flashmind_inputText");
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleSubmit = async () => {
      if (!inputText.trim()) {
        alert("Please insert notes to generate flashcards.");
        return;
      }

      try {
        setIsLoading(true);

        const response = await fetch("https://flashmind.onrender.com/generate-flashcards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ inputText }),
        });

        if (!response.ok) throw new Error("Failed to generate flashcards.");

        const data = await response.json();
        const { flashcards, title } = data;

        localStorage.setItem("flashcards", JSON.stringify(flashcards));
        localStorage.setItem("flashcardTitle", title);

        setGeneratedFlashcards(flashcards);
        setGeneratedTitle(title);

        navigate("/view", { state: { flashcards, title } });

        // Clear input after navigation
        setInputText("");
        setUploadedFile(null);
        localStorage.removeItem("flashmind_inputText");
        if (fileInputRef.current) fileInputRef.current.value = "";

      } catch (error) {
        alert("Error: " + error.message);
      } finally {
        setIsLoading(false);
      }
    };

    const handleFileUpload = async (e) => {
      const file = e.target.files[0];
      setUploadedFile(file);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("https://flashmind.onrender.com/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload file.");

        const data = await response.json();

        const cleanedText = data.text
          .replace(/[ \t]+/g, " ")         
          .replace(/\n{3,}/g, "\n\n")       
          .replace(/ +\n/g, "\n")          
          .trim();                         

        setInputText(cleanedText);
        localStorage.setItem("flashmind_inputText", cleanedText);
      } catch (error) {
        alert("Error uploading file: " + error.message);
      }
    };

    const handleVoiceInput = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
      }

      if (!recognitionRef.current) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;

        recognitionRef.current.onstart = () => {
          console.log("Voice recognition started.");
          setIsRecording(true);
        };

        recognitionRef.current.onresult = (event) => {
          let interimTranscript = "";

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptRef.current += " " + transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          setInputText(finalTranscriptRef.current + " " + interimTranscript);
        };

        recognitionRef.current.onerror = (event) => {
          alert("Voice recognition error: " + event.error);
          setIsRecording(false);
        };

        recognitionRef.current.onend = () => {
          console.log("Voice recognition ended.");
          setIsRecording(false);
        };
      }

      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        recognitionRef.current.start();
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
              onChange={(e) => {
                setInputText(e.target.value);
                localStorage.setItem("flashmind_inputText", e.target.value);
              }}
              tabIndex="0"
            />
            <div className="input-buttons">
              <div className="button-group">
                <label className="upload-btn" tabIndex="0">
                  <FaUpload /> Upload File
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                  />
                </label>

                <button
                  className={`mic-btn ${isRecording ? "recording" : ""}`}
                  onClick={handleVoiceInput}
                  tabIndex="0"
                  aria-label={isRecording ? "Stop recording" : "Start voice input"}
                >
                  <FaMicrophone />
                </button>
              </div>

             <div className="submit-container">
              {!isLoading && (
                <button className="submit-btn" onClick={handleSubmit}>
                  <FaArrowRight />
                </button>
              )}
            </div>
            {isLoading && (
              <div className="loading-overlay">
                 <Lottie
                    animationData={loaderAnimation}
                    loop
                    autoplay
                    style={{ width: 300, height: 300 }}
                  />
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  export default Generate;