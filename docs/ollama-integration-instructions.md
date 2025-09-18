# Integrating Ollama AI Model for Dynamic Test Data Generation in Selenium Tests

This document explains how to integrate the Ollama local AI model "phi4-mini-reasoning:latest" into your Selenium Grid test automation framework to generate realistic, random, and logically consistent test data for the "create goal" functionality.

---

## Prerequisites

- Ollama installed and running locally: https://ollama.com/
- The model "phi4-mini-reasoning:latest" pulled and available locally
- Selenium Grid and your application running and accessible
- Node.js environment for running Selenium tests

---

## Step 1: Start Ollama Local API Server

1. Ensure Ollama is installed and the model is available:
   ```sh
   ollama pull phi4-mini-reasoning:latest
   ```
2. Start the Ollama API server (default port 11434):
   ```sh
   ollama serve
   ```
3. Confirm the API is reachable at `http://localhost:11434`.

---

## Step 2: Update Selenium Test Script

- Use the provided test script `seleniumGridTests.js` which includes:
  - A prompt designed to generate a complete, realistic goal JSON object.
  - A function `generateGoalData()` that calls the Ollama API to get the generated data.
  - Parsing and validation of the JSON response.
  - Filling the goal creation form fields dynamically with the generated data.

---

## Step 3: Environment Variables

Set the following environment variables before running tests:

| Variable           | Description                          | Default                      |
|--------------------|------------------------------------|------------------------------|
| SELENIUM_GRID_URL   | URL of Selenium Grid Hub            | http://localhost:4444/wd/hub |
| BASE_URL           | Base URL of your application        | http://localhost:3000        |
| TEST_USER_EMAIL    | Email for test user login           | testuser@example.com         |
| TEST_USER_PASSWORD | Password for test user login        | TestPassword123!             |
| OLLAMA_API_URL     | URL of Ollama API server            | http://localhost:11434       |

Example (Windows PowerShell):

```powershell
$env:SELENIUM_GRID_URL="http://localhost:4444/wd/hub"
$env:BASE_URL="http://localhost:3000"
$env:TEST_USER_EMAIL="yourtestuser@example.com"
$env:TEST_USER_PASSWORD="YourPassword123!"
$env:OLLAMA_API_URL="http://localhost:11434"
```

---

## Step 4: Run the Tests

1. Install dependencies if not done:
   ```sh
   npm install selenium-webdriver node-fetch
   ```
2. Run the test script:
   ```sh
   node tests/integration/seleniumGridTests.js
   ```

---

## Notes

- The prompt ensures the deadline is exactly one year from the current date.
- The NLP answers cover all required questions fully.
- The test script expects the AI output to be valid JSON; errors in parsing will be logged.
- Adjust time zones if needed for your application’s datetime-local input.

---

## Troubleshooting

- If Ollama API returns errors, verify the model is pulled and the server is running.
- If JSON parsing fails, inspect the raw response logged in the console.
- Ensure Selenium Grid nodes have the required browsers and drivers installed.

---

## Summary

This integration enables dynamic, AI-driven test data generation for robust and realistic Selenium tests, improving test coverage and reducing manual test data maintenance.
