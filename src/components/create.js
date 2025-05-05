import React, { useState, useEffect, useRef } from "react";
import "./create.css";
import { useNavigate } from "react-router-dom";
import logo from "../assets/FlashMind-Logo.png";
import { FaTrash } from "react-icons/fa";
import { BsList } from "react-icons/bs";
import { LuSparkles, LuPencil } from "react-icons/lu";
import { MdDeleteSweep } from "react-icons/md";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

const Create = () => {
  const [flashcards, setFlashcards] = useState([
    { id: 1, term: "", definition: "" },
    { id: 2, term: "", definition: "" },
    { id: 3, term: "", definition: "" }
  ]);
  const lastInputRef = useRef(null);
  const [title, setTitle] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const savedFlashcards = JSON.parse(localStorage.getItem("flashcards"));
    const savedTitle = localStorage.getItem("flashcardTitle");

    if (savedFlashcards) setFlashcards(savedFlashcards);
    if (savedTitle) setTitle(savedTitle);
  }, []);

  useEffect(() => {
    localStorage.setItem("flashcards", JSON.stringify(flashcards));
  }, [flashcards]);

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
    localStorage.setItem("flashcardTitle", e.target.value);
  };

  const addFlashcard = () => {
    const lastCard = flashcards[flashcards.length - 1];
    
    if (!lastCard.term.trim() || !lastCard.definition.trim()) {
      alert("Please fill in the term and definition before adding a new card.");
      return;
    }

    setFlashcards((prevFlashcards) => [
      ...prevFlashcards, 
      { id: prevFlashcards.length + 1, term: "", definition: "" }
    ]);

    setTimeout(() => {
      if (lastInputRef.current) {
        lastInputRef.current.focus();
      }
    }, 100);
  };

  const removeFlashcard = (id) => {
    if (flashcards.length === 1) {
      alert("You can't delete anymore. At least one flashcard must remain.");
      return;
    }

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this flashcard?"
    );
    if (!confirmDelete) return;

    const updatedFlashcards = flashcards.filter((card) => card.id !== id);

    const reindexedFlashcards = updatedFlashcards.map((card, index) => ({
      ...card,
      id: index + 1,
    }));

    setFlashcards(reindexedFlashcards);
  };

  const clearAllFlashcards = () => {
    const confirmClear = window.confirm("Are you sure you want to clear everything?");
    if (!confirmClear) return;
  
    const defaultFlashcards = [
      { id: 1, term: "", definition: "" },
      { id: 2, term: "", definition: "" },
      { id: 3, term: "", definition: "" }
    ];
  
    setFlashcards(defaultFlashcards);
    setTitle("");
    localStorage.removeItem("flashcards");
    localStorage.removeItem("flashcardTitle");
  };

  const handleCreateFlashcards = () => {
    if (!title.trim() || flashcards.some(card => !card.term.trim() || !card.definition.trim())) {
      alert("Please fill up all fields before creating flashcards.");
      return;
    }

    const confirmCreate = window.confirm("Are you sure you want to create these flashcards?");
    if (!confirmCreate) return;
  
    localStorage.setItem("flashcards", JSON.stringify(flashcards));
    localStorage.setItem("flashcardTitle", title);
  
    navigate("/view"); // Go to the view page first
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

      <div className="create">
        <div className="create-container">
          <h2 className="title-create">Create Flashcards</h2>
          <div className="button-group">
            <button className="clear-btn" onClick={clearAllFlashcards}>
              <MdDeleteSweep />
            </button>
            <button className="create-btn-process" onClick={handleCreateFlashcards}>
              <LuPencil /> Create
            </button>
          </div>
        </div>

        <input 
          type="text" 
          className="title-input" 
          placeholder="Enter Title" 
          maxLength={50} 
          value={title}
          onChange={handleTitleChange}
        />
        
        <DragDropContext
          onDragEnd={(result) => {
            const { source, destination } = result;
            if (!destination) return;

            const reordered = Array.from(flashcards);
            const [removed] = reordered.splice(source.index, 1);
            reordered.splice(destination.index, 0, removed);

            // Reassign IDs after reorder
            const reindexed = reordered.map((card, index) => ({
              ...card,
              id: index + 1,
            }));

            setFlashcards(reindexed);
          }}    
        >
          <Droppable droppableId="flashcards">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={snapshot.isDraggingOver ? "dragging-over" : ""}
              >
                {flashcards.map((card, index) => (
                  <Draggable key={card.id} draggableId={card.id.toString()} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flashcard-input ${snapshot.isDragging ? "dragging" : ""}`}
                      >
                        <div className="card-header">
                          <span className="card-number">{card.id}</span>
                          <div className="card-actions">
                            <div {...provided.dragHandleProps}>
                              <BsList className="move-icon" />
                            </div>
                            <FaTrash
                              className="delete-icon"
                              onClick={() => removeFlashcard(card.id)}
                            />
                          </div>
                        </div>
                        <div className="card-content">
                          <div className="input-wrapper">
                            <textarea
                              value={card.term}
                              onChange={(e) => {
                                const updatedFlashcards = flashcards.map((c) =>
                                  c.id === card.id ? { ...c, term: e.target.value } : c
                                );
                                setFlashcards(updatedFlashcards);
                              }}
                              className="term-input"
                              placeholder="Enter Term"
                            />
                            <span className="input-label">TERM</span>
                          </div>
                          <div className="input-wrapper">
                            <textarea
                              value={card.definition}
                              onChange={(e) => {
                                const updatedFlashcards = flashcards.map((c) =>
                                  c.id === card.id ? { ...c, definition: e.target.value } : c
                                );
                                setFlashcards(updatedFlashcards);
                              }}
                              className="definition-input"
                              placeholder="Enter Definition"
                            />
                            <span className="input-label">DEFINITION</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        <div className="add-card" onClick={addFlashcard}>ADD CARD</div>
        <button className="create-btn-process" onClick={handleCreateFlashcards}>
          <LuPencil /> Create
        </button>
      </div>
    </div>
  );
};

export default Create;