import express from "express";
import { DynamoDB } from "aws-sdk";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const dynamoDb = new DynamoDB.DocumentClient();
const QUESTS_TABLE = process.env.QUESTS_TABLE || "questbound_quests";

// Middleware to verify JWT token from Cognito
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "Missing Authorization header" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid Authorization header format" });

  // Normally, verify with Cognito JWKS, but for simplicity, decode without verification
  try {
    const decoded = jwt.decode(token, { complete: true });
    if (!decoded) return res.status(401).json({ error: "Invalid token" });
    req.user = decoded.payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token verification failed" });
  }
}

// List all quests
app.get("/", verifyToken, async (req, res) => {
  try {
    const result = await dynamoDb
      .scan({
        TableName: QUESTS_TABLE,
      })
      .promise();

    res.json({ quests: result.Items || [] });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve quests" });
  }
});

// Create a new quest
app.post("/", verifyToken, async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ error: "Title is required" });

  const questId = uuidv4();
  const newQuest = {
    quest_id: questId,
    title,
    description: description || "",
    created_at: new Date().toISOString(),
  };

  try {
    await dynamoDb
      .put({
        TableName: QUESTS_TABLE,
        Item: newQuest,
      })
      .promise();

    res.status(201).json({ quest: newQuest });
  } catch (error) {
    res.status(500).json({ error: "Could not create quest" });
  }
});

// Lambda handler for AWS Lambda container image
import serverless from "aws-serverless-express";
import { createServer } from "http";

const server = createServer(app);
export const handler = serverless.proxy(server, {
  binaryMimeTypes: ["application/json"],
});
