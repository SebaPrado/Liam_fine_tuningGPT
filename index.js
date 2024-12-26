//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

require("dotenv").config();
const ngrok = require("@ngrok/ngrok");

const express = require("express");
const OpenAI = require("openai");
const functions = require("./functions");

// Configuración inicial
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// ==========   2)  Crear o cargar el ID del asistente    =========== //

// 2.a ) Variable global para almacenar el ID del asistente //
let assistant_id;
// 2.b) Función asíncrona para inicializar el asistente
async function initializeAssistant() {
  // Llama a la función create_assistant y espera su resultado
  assistant_id = await functions.create_assistant(client);
  console.log("Assistant created with ID:", assistant_id);
}
initializeAssistant();

//  =============       Ruta START     ===========   //
//  Inicia una nueva conversación con la API de OpenAI   //
//  Crea un nuevo "thread" usando la API de OpenAI       //
//  Un "thread" es como una conversación nueva y única   //
//  Cada thread mantiene su propio historial de mensajes //

app.get("/start", async (req, res) => {
  try {
    // Crea un nuevo "thread" (hilo de conversación) usando la API de OpenAI
    const thread = await client.beta.threads.create();

    // Registra el ID del nuevo thread en la consola
    console.log("New conversation started with thread ID:", thread.id);

    // Devuelve el ID del thread al cliente
    res.json({ thread_id: thread.id });

    // Manejo de errores
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================      Ruta CHAT    ================ //
app.post("/chat", async (req, res) => {
  const { thread_id, message = "" } = req.body;

  // Add validation for assistant_id
  if (!assistant_id) {
    console.log("Error: Assistant not initialized");
    return res.status(500).json({
      error: "Assistant not initialized",
      details: "Please wait for assistant initialization to complete",
    });
  }

  // Add validation for ManyChat custom fields
  if (thread_id && thread_id.includes("{{")) {
    console.log("Error: Invalid thread_id format");
    return res.status(400).json({
      error: "Invalid thread_id format",
      details: "Custom field not properly replaced",
    });
  }

  if (!thread_id) {
    console.log("Error: Missing thread_id in /chat");
    return res.status(400).json({ error: "Missing thread_id" });
  }

  try {
    console.log("Processing chat request:", {
      thread_id,
      message,
      assistant_id,
    });

    // Create message
    await client.beta.threads.messages.create({
      thread_id,
      role: "user",
      content: message,
    });

    // Create run
    const run = await client.beta.threads.runs.create({
      thread_id,
      assistant_id,
      role: "user",
    });

    console.log("Run started with ID:", run.id);
    return res.json({ run_id: run.id });
  } catch (error) {
    console.error("Chat error details:", error);
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
});

//  ==================      Ruta CHECK        ======================   //

app.post("/check", async (req, res) => {
  const { thread_id, run_id } = req.body;

  if (!thread_id || !run_id) {
    console.log("Error: Missing thread_id or run_id in /check");
    return res.json({ response: "error" });
  }

  try {
    const runStatus = await client.beta.threads.runs.retrieve({
      thread_id,
      run_id,
    });

    console.log("Checking run status:", runStatus.status);

    if (runStatus.status === "completed") {
      const messages = await client.beta.threads.messages.list({
        thread_id,
      });
      let messageContent = messages.data[0].content[0].text;

      // Remover anotaciones si existen
      if (messageContent.annotations) {
        for (const annotation of messageContent.annotations) {
          messageContent.value = messageContent.value.replace(
            annotation.text,
            ""
          );
        }
      }

      return res.json({
        response: messageContent.value,
        status: "completed",
      });
    }

    if (runStatus.status === "requires_action") {
      console.log("Action required...");
      // Aquí puedes manejar las acciones requeridas
      return res.json({ status: "in_progress" });
    }

    return res.json({ status: "in_progress" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Puerto de escucha
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
