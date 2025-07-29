const express = require("express");
const axios = require("axios");

const app = express();
const PORT = 3000;

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Environment variable for delay (default 5 seconds)
const DELAY_SECONDS = parseInt(process.env.DELAY_SECONDS) || 5;

app.post("/webhook", async (req, res) => {
  const { updateCallback, description } = req.body;

  console.log("Received webhook:", {
    updateCallback,
    description,
    delay: DELAY_SECONDS,
  });

  // Respond immediately with 200
  res.status(200).json({
    message: "Webhook received",
    delay: DELAY_SECONDS,
  });

  // Process callback after delay
  setTimeout(async () => {
    try {
      const trimmedDescription = (description || "").trim();
      const shouldPass = trimmedDescription.endsWith(".");
      const status = shouldPass ? "pass" : "fail";

      console.log(`After ${DELAY_SECONDS}s delay:`);
      console.log(`Description: "${trimmedDescription}"`);
      console.log(`Ends with period: ${shouldPass}`);
      console.log(`Status: ${status}`);
      console.log(`Calling update endpoint: ${updateCallback}`);

      if (updateCallback) {
        const updateData = {
          status: status,
          messages: [`Build completed with status: ${status}`],
        };

        console.log("Sending update data:", updateData);

        // Fire and forget approach - don't wait for response
        axios
          .post(updateCallback, updateData, {
            timeout: 10000,
            validateStatus: (status) => status < 500,
            headers: {
              "Content-Type": "application/json",
            },
          })
          .then((response) => {
            console.log(
              `Update response: ${response.status} - ${response.statusText}`
            );
            console.log(`Response data:`, response.data);
          })
          .catch((error) => {
            console.error("Update error:", error.message);
          });

        console.log("Update request sent (not waiting for response)");
      } else {
        console.log("No update callback URL provided");
      }
    } catch (error) {
      console.error("Error calling update callback:", error.message);
    }
  }, DELAY_SECONDS * 1000);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", delay: DELAY_SECONDS });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Delay set to ${DELAY_SECONDS} seconds`);
  console.log("POST to /webhook to trigger callback logic");
});
