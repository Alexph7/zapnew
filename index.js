import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import https from "https";

dotenv.config();

const app = express();
app.use(express.json());

const httpsAgent = new https.Agent({
    keepAlive: true,
    maxSockets: 10,
});

// REGEX: códigos 8–10 chars, letras + números, sem símbolos
const REGEX_CODES =
    /(?<=^|\s)(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{8,10}(?=\s|$)/gi;


// ========================
// VARIÁVEIS DE AMBIENTE
// ========================
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

if (!TG_TOKEN || !TG_CHAT_ID) {
    console.error("❌ Variáveis de ambiente não carregadas");
    process.exit(1);
}

// ========================
// ROTA ROOT (TESTE)
// ========================
app.get("/", (req, res) => {
    res.send("Webhook OK");
});

// ========================
// WEBHOOK WHAPI
// ========================
app.post("/webhook/messages", (req, res) => {
    try {
        const messages = req.body.messages;
        if (!Array.isArray(messages)) {
            return res.sendStatus(200);
        }

        // RESPONDE IMEDIATAMENTE AO WHAPI
        res.sendStatus(200);

        // PROCESSA EM BACKGROUND
        for (const msg of messages) {
            if (msg.from_me) continue;

            if (msg.type === "text" && msg.text?.body) {
                const matches = msg.text.body.match(REGEX_CODES);
                if (!matches || matches.length === 0) continue;

                const formatado = matches
                    .map(c => `\`${c.toUpperCase()}\``)
                    .join("\n");

                enviarTelegram(formatado);

            }
        }

    } catch (err) {
        console.error("Erro no webhook:", err);
    }
});

function preAquecerTelegram() {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendChatAction`;

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            chat_id: TG_CHAT_ID,
            action: "typing"
        }),
        agent: httpsAgent,
    }).catch(() => { });
}

// ========================
// FUNÇÃO TELEGRAM
// ========================
function enviarTelegram(texto) {
    const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

    const payload = {
        chat_id: TG_CHAT_ID,
        text: texto,
        parse_mode: "MarkdownV2",
    };

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        agent: httpsAgent,
    }).catch(err => {
        console.error("Erro Telegram:", err.message);
    });

}

// ========================
// START SERVER
// ========================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Node rodando na porta ${PORT}`);

    // pré-aquece ao subir
    preAquecerTelegram();
});
// mantém o caminho quente
setInterval(preAquecerTelegram, 5 * 60 * 1000);
