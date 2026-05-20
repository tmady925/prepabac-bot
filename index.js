const express = require("express");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(express.json());

/* =========================
   ENV VARIABLES
========================= */
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const PORT = process.env.PORT || 3000;

/* =========================
   HEALTH CHECK (Render)
========================= */
app.get("/", (req, res) => {
    res.send("🚀 Prepabac bot is running");
});

/* =========================
   WEBHOOK VERIFICATION
========================= */
app.get("/webhook", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    console.log("🔍 Webhook verification request received");

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully");
        res.status(200).send(challenge);
    } else {
        console.log("❌ Webhook verification failed");
        res.sendStatus(403);
    }
});

/* =========================
   RECEIVE MESSAGES
========================= */
app.post("/webhook", async (req, res) => {
    console.log("🔥 WEBHOOK RECEIVED:");
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const message =
            req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) {
            console.log("⚠️ Aucun message");
            return res.sendStatus(200);
        }

        const from = message.from;
        const text = message.text?.body;

        console.log("📩 MESSAGE:", text);

        if (!text) return res.sendStatus(200);

        console.log("📤 Envoi réponse...");

        await sendMessage(
            from,
            `👋 Reçu: "${text}"`
        );

        console.log("✅ Réponse envoyée");

    } catch (err) {
        console.error("❌ ERREUR:");
        console.error(err.response?.data || err.message);
    }

    res.sendStatus(200);
});
/* =========================
   SEND MESSAGE FUNCTION
========================= */
async function sendMessage(to, message) {
    try {
        const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

        const data = {
            messaging_product: "whatsapp",
            to: to,
            text: { body: message }
        };

        const headers = {
            Authorization: `Bearer ${TOKEN}`,
            "Content-Type": "application/json"
        };

        const response = await axios.post(url, data, { headers });

        console.log("✅ Message envoyé:", response.data);
    } catch (err) {
        console.error("❌ ERREUR WHATSAPP API:");
        console.error(err.response?.data || err.message);
    }
}

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
    console.log("🚀 Prepabac bot running on port", PORT);
});