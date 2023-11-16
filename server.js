const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");
const dotenv = require("dotenv");
const axios = require("axios");

dotenv.config();

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));

app.post("/webhook", async (req, res) => {
  const userMessage = req.body.Body;
  const senderNumber = req.body.From;
  console.log(senderNumber);
  try {
    const weatherData = await getWeather(userMessage);

    if (weatherData) {
      const responseMessage = `The weather in ${userMessage} is ${weatherData}.`;
      sendWhatsAppMessage(senderNumber, responseMessage);
    } else {
      sendWhatsAppMessage(
        senderNumber,
        "Sorry, I could not retrieve the weather information."
      );
    }
  } catch (error) {
    console.error("Error processing weather request:", error.message);
    sendWhatsAppMessage(
      senderNumber,
      "Sorry, something went wrong. Please try again later."
    );
  }

  res.sendStatus(200);
});

async function getWeather(city) {
  const openWeatherApiKey = process.env.OPENWEATHERMAP_API_KEY;

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${openWeatherApiKey}`
    );
    const weatherDescription = response.data.weather[0].description;
    return weatherDescription;
  } catch (error) {
    console.error("Error fetching weather data:", error.message);
    throw error;
  }
}

function sendWhatsAppMessage(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

  const client = twilio(accountSid, authToken);

  client.messages
    .create({
      body: body,
      from: `whatsapp:${twilioNumber}`,
      to: `${to}`,
    })
    .then((message) => console.log("Message sent:", message.sid))
    .catch((error) => console.error("Error sending message:", error.message));
}

app.listen(port, () => {
  console.log(`Server is runnin g on http://localhost:${port}`);
});
