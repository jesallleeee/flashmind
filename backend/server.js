require("dotenv").config();
const express = require("express");
const multer = require("multer");
const cors = require("cors");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const path = require("path");
const { CohereClient } = require("cohere-ai");

const cohere = new CohereClient({
  token: process.env.COHERE_API_KEY,
});

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// File upload setup
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Route: Upload & extract text from file
app.post("/upload", upload.single("file"), async (req, res) => {
  const file = req.file;

  if (!file) return res.status(400).json({ error: "No file uploaded" });

  const ext = path.extname(file.originalname).toLowerCase();

  try {
    let text = "";

    if (ext === ".txt") {
      text = fs.readFileSync(file.path, "utf-8");
    } else if (ext === ".pdf") {
      const dataBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(dataBuffer);
      text = pdfData.text;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    return res.json({ text });
  } catch (err) {
    return res.status(500).json({ error: "Error processing file" });
  }
});

// Route: Generate flashcards using Cohere
app.post("/generate-flashcards", async (req, res) => {
  const { inputText } = req.body;

  if (!inputText || inputText.trim() === "") {
    return res.status(400).json({ error: "No input text provided" });
  }

  try {
    const prompt = `
      Convert the following study notes into a JSON object with the following format:

      {
        "title": "A concise and relevant title for the flashcards",
        "flashcards": [
          {
            "term": "A short, one-to-three word concept",
            "definition": "A concise explanation of the term."
          },
          ...
        ]
      }

      ⚠️ Important Instructions:
      - Only return a valid JSON object. Do not include any preamble, explanation, or formatting text.
      - The output must start with '{' and end with '}'.
      - Do not wrap the output in code blocks or quotes.
      - Make sure the JSON is syntactically correct and fully closed.

      Notes:
      ${inputText}

      Output:
    `;

    const response = await cohere.generate({
      model: "command-r-plus",
      prompt,
      maxTokens: 800,
      temperature: 0.3,
    });

    const cohereResponse = response?.generations?.[0]?.text;

    if (!cohereResponse) {
      return res.status(500).json({ error: "Cohere did not return any text" });
    }

    const jsonStart = cohereResponse.indexOf("{");
    const jsonEnd = cohereResponse.lastIndexOf("}") + 1;
    const jsonText = cohereResponse.substring(jsonStart, jsonEnd);

    console.log("Cohere response:", cohereResponse);
    console.log("Extracted JSON:", jsonText);

    try {
      const parsed = JSON.parse(jsonText);
      const { title = "Untitled Flashcards", flashcards = [] } = parsed;

      // ✅ Filter out any invalid flashcard objects
      const isValidFlashcard = (card) =>
        card &&
        typeof card.term === "string" &&
        typeof card.definition === "string" &&
        card.term.length > 0 &&
        card.definition.length > 0;

      const validFlashcards = flashcards.filter(isValidFlashcard);

      if (validFlashcards.length === 0) {
        return res.status(500).json({ error: "No valid flashcards generated." });
      }

      return res.json({ title, flashcards: validFlashcards });
    } catch (parseError) {
      console.error("Failed to parse flashcards JSON:", parseError);
      return res.status(500).json({ error: "AI returned invalid JSON. Please try again." });
    }


  } catch (err) {
    console.error("Cohere error:", err);
    return res.status(500).json({ error: "Failed to generate flashcards" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});