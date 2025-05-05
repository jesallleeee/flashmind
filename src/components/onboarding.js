import React from "react";
import "./onboarding.css";
import { useNavigate } from "react-router-dom"; 
import logo from "../assets/FlashMind-Logo.png";
import Feature1 from '../assets/Feature-1.png';
import Feature2 from '../assets/Feature-2.png';
import Feature3 from '../assets/Feature-3.png';
import { LuPencil } from "react-icons/lu";

function Onboarding() {
  const navigate = useNavigate();
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
      <button className="create-btn" onClick={() => navigate("/create")}><LuPencil />    Create Flashcard</button>
    </header>
    
    <div className="hero">
    <h1 className="hero-title">Study Smarter, Learn Faster!</h1>
    <div className="hero-subtitle">
      FlashMind helps you memorize and retain information <br /> easily with smart flashcards.
    </div>
    <button className="generate-btn" onClick={() => navigate("/generate")}>Generate Flashcard</button>
    </div>

    <section className="features">
      <div className="feature-card" style={{ backgroundImage: `url(${Feature1})` }}>
          <h3 className="feature-title">Generate<br />Flashcard</h3>
      </div>
      <div className="feature-card" style={{ backgroundImage: `url(${Feature2})` }}>
          <h3 className="feature-title">Boost<br />Memory</h3>
      </div>
      <div className="feature-card" style={{ backgroundImage: `url(${Feature3})` }}>
          <h3 className="feature-title">Learn<br />Efficiently</h3>
      </div>
    </section>
    </div>
  );
}

export default Onboarding;