const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

app.post("/chat", async (req, res) => {
  const { messages } = req.body;
  const apiKey = process.env.OPENAI_KEY;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: messages,
    }),
  });

  const data = await response.json();
  res.json(data);
});

app.listen(3210, () => {
  console.log("LLM proxy listening on http://localhost:3210");
});
