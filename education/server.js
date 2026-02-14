const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
app.use(cors());
// Increased limit to 10MB to handle long 1-hour YouTube transcripts safely
app.use(express.json({ limit: '10mb' })); 

// 1. API Initialization
const API_KEY = "AIzaSyB93OeIAKSRuV7OBwajIgwFYxG-8XogNok"; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-flash",
    systemInstruction: "You are the Glow Scribe. You only summarize the EXACT text provided. Do not use outside knowledge." 
});

// 2. Real-Time Transcriber Route
app.post('/generate-notes', async (req, res) => {
    const { transcript } = req.body;
    try {
        const prompt = "Summarize this transcript into professional notes: " + transcript;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        res.json({ notes: response.text() });
    } catch (error) {
        console.error("❌ Transcriber Error:", error.message);
        res.status(500).json({ notes: `API Error: ${error.message}` });
    }
});

// 3. Tube Scribe Route (Improved for accuracy)
app.post('/youtube-to-notes', async (req, res) => {
    const { videoUrl } = req.body;
    try {
        console.log("🔗 Fetching YouTube transcript for:", videoUrl);
        
        // Fetch the actual text from the video
        const transcriptItems = await YoutubeTranscript.fetchTranscript(videoUrl);
        const fullText = transcriptItems.map(item => item.text).join(' ');

        // IMPROVED PROMPT: Forces the AI to ignore outside topics (like the MLOps one you saw earlier)
        const prompt = `
            USER ROLE: B.Tech Student.
            TASK: Summarize the transcript provided below. 
            STRICT RULE: Only use information from the provided text. If the text is about Java, do not talk about MLOps.
            
            TRANSCRIPT: ${fullText}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;

        res.json({ notes: response.text() });
    } catch (error) {
        console.error("❌ YouTube Error:", error.message);
        res.status(500).json({ notes: "Could not fetch transcript. This video might have captions disabled or it is private." });
    }
});

app.listen(3000, () => {
    console.log("🚀 Glow Stack Backend active on http://127.0.0.1:3000");
});