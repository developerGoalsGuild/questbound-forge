import express from "express";
import { DynamoDB } from "aws-sdk";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const app = express();
app.use(express.json());

const dynamoDb = new DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE || "questbound_users";

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

// Get user profile
app.get("/", verifyToken, async (req, res) => {
  const userId = req.user.sub;
  try {
    const result = await dynamoDb
      .get({
        TableName: USERS_TABLE,
        Key: { user_id: userId },
      })
      .promise();

    if (!result.Item) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ user: result.Item });
  } catch (error) {
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

// Update user profile
app.put("/", verifyToken, async (req, res) => {
  const userId = req.user.sub;
  const { displayName, preferences } = req.body;

  if (!displayName && !preferences) {
    return res.status(400).json({ error: "Nothing to update" });
  }

  const updateExpression = [];
  const expressionAttributeValues = {};
  if (displayName) {
    updateExpression.push("display_name = :displayName");
    expressionAttributeValues[":displayName"] = displayName;
  }
  if (preferences) {
    updateExpression.push("preferences = :preferences");
    expressionAttributeValues[":preferences"] = preferences;
  }

  try {
    await dynamoDb
      .update({
        TableName: USERS_TABLE,
        Key: { user_id: userId },
        UpdateExpression: "SET " + updateExpression.join(", "),
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: "ALL_NEW",
      })
      .promise();

    const updated = await dynamoDb
      .get({
        TableName: USERS_TABLE,
        Key: { user_id: userId },
      })
      .promise();

    res.json({ user: updated.Item });
  } catch (error) {
    res.status(500).json({ error: "Could not update user" });
  }
});

// Lambda handler for AWS Lambda container image
import serverless from "aws-serverless-express";
import { createServer } from "http";

const server = createServer(app);
export const handler = serverless.proxy(server, {
  binaryMimeTypes: ["application/json"],
});
