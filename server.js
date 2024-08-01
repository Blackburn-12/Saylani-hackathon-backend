const express = require("express");
const multer = require("multer");
const fs = require("fs");
const axios = require("axios");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Connect Database
connectDB();

// Init Middleware
app.use(express.json({ extended: false }));
const allowedOrigins = [
  'http://localhost:5173',
  'https://saylani-hackathon-student.vercel.app',
  'https://saylani-hackathon-frontend-admin.vercel.app'
];

// Configure CORS middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
  credentials: true,
}));

// Configure Multer for handling file uploads
const upload = multer({ dest: "Upload/" });
const uploadProfile = multer({ dest: "Upload Profile" });

// Endpoint to handle file uploads and text detection
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath);
    const text = await detectText(fileContent);
    res.json({ text });
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

app.post("/uploadProfile", uploadProfile.single("image"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const fileContent = fs.readFileSync(filePath);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).json({ error: "Failed to process image" });
  }
});

// Function to detect text using Google Cloud Vision API
async function detectText(imageContent) {
  try {
    const response = await axios.post(
      "https://vision.googleapis.com/v1/images:annotate",
      {
        requests: [
          {
            image: {
              content: imageContent.toString("base64"),
            },
            features: [{ type: "TEXT_DETECTION" }],
          },
        ],
      },
      {
        params: {
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    const fullText = response.data.responses[0].fullTextAnnotation.text;
    console.log("Extracted Text:", fullText);
    return fullText;
  } catch (error) {
    console.error("Error detecting text:", error);
    throw error;
  }
}

// Endpoint to handle received data from frontend
// app.post("/processData", (req, res) => {
//   const { extractedText } = req.body;
//   console.log("Received data from frontend:", extractedText);

//   // Respond with a success message
//   res.json({ message: "Data received successfully" });
// });

// Define Routes for authentication
app.use("/", require("./routes/auth"));

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
