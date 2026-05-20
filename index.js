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

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 WEBHOOK VERIFICATION REQUEST");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Mode reçu        :", JSON.stringify(mode));
    console.log("Token reçu Meta  :", JSON.stringify(token));
    console.log("Token dans .env  :", JSON.stringify(VERIFY_TOKEN));
    console.log("Challenge        :", JSON.stringify(challenge));
    console.log("Tokens identiques:", token === VERIFY_TOKEN);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (mode && token === VERIFY_TOKEN) {
        console.log("✅ Webhook verified successfully");
        res.status(200).send(challenge);
    } else {
        console.log("❌ Webhook verification failed");
        if (!mode) console.log("   → Raison : hub.mode manquant");
        if (token !== VERIFY_TOKEN) console.log("   → Raison : token mismatch");
        res.sendStatus(403);
    }
});

/* =========================
   RECEIVE MESSAGES
========================= */
app.post("/webhook", async (req, res) => {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔥 WEBHOOK POST RECEIVED");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(JSON.stringify(req.body, null, 2));

    try {
        const message =
            req.body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

        if (!message) {
            console.log("⚠️ Aucun message dans le payload");
            return res.sendStatus(200);
        }

        const from = message.from;
        const text = message.text?.body;

        console.log("📩 De     :", from);
        console.log("📩 Message:", text);

        if (!text) return res.sendStatus(200);

        console.log("📤 Envoi réponse...");

        await sendMessage(from, `👋 Reçu: "${text}"`);

        console.log("✅ Réponse envoyée avec succès");

    } catch (err) {
        console.error("❌ ERREUR HANDLER:");
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

        console.log("📡 Appel WhatsApp API...");
        console.log("   → URL            :", url);
        console.log("   → PHONE_NUMBER_ID:", PHONE_NUMBER_ID);
        console.log("   → TOKEN présent  :", !!TOKEN);

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
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚀 Prepabac bot running on port", PORT);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("VERIFY_TOKEN défini  :", !!VERIFY_TOKEN);
    console.log("WHATSAPP_TOKEN défini:", !!TOKEN);
    console.log("PHONE_NUMBER_ID      :", PHONE_NUMBER_ID);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
});