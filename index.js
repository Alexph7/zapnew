import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

// ========================
// VARIÁVEIS DE AMBIENTE
// ========================
const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;
const WHAPI_CHANNEL_NAME = process.env.WHAPI_CHANNEL_NAME;


if (!TG_TOKEN || !TG_CHAT_ID) {
  console.error("❌ Variáveis de ambiente não carregadas");
  process.exit(1);
}

if (!WHAPI_CHANNEL_NAME) {
  console.error("❌ WHAPI_CHANNEL_NAME não definido");
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
app.post("/webhook/messages", async (req, res) => {
  console.log("WEBHOOK RECEBIDO");
  console.log("URL:", req.originalUrl);
  console.log(JSON.stringify(req.body, null, 2));

  try {
    const messages = req.body.messages;
    if (!Array.isArray(messages)) {
      return res.sendStatus(200);
    }

    for (const msg of messages) {
      // ignora mensagens enviadas por você mesmo
      if (msg.from_me) continue;

    // ignora qualquer coisa que NÃO seja o canal alvo
    if (msg.chat_name !== WHAPI_CHANNEL_NAME) {
      continue;
    }

      if (msg.type === "text" && msg.text?.body) {
        const texto = msg.text.body;

        await enviarTelegram(texto);
      }
    }

    res.sendStatus(200);
  } catch (err) {
    console.error("Erro ao processar webhook:", err);
    res.sendStatus(500);
  }
});

// ========================
// FUNÇÃO TELEGRAM
// ========================
async function enviarTelegram(texto) {
  const url = `https://api.telegram.org/bot${TG_TOKEN}/sendMessage`;

  const payload = {
    chat_id: TG_CHAT_ID,
    text: texto,
  };

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const erro = await resp.text();
    console.error("Erro Telegram:", erro);
  }
}

// ========================
// START SERVER
// ========================
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Node rodando na porta ${PORT}`);
});
