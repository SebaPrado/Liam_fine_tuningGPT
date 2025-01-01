//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

require("dotenv").config();
const ngrok = require("@ngrok/ngrok");

const express = require("express");
const OpenAI = require("openai");
const functions = require("./functions");
const { log } = require("console");

// Configuración inicial
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// // ==========   2)  Crear o cargar el ID del asistente    =========== //

let assistant_id; // variable para almacenar el assistant_id
async function initializeAssistant() {
  assistant_id = await functions.create_assistant(client);
  console.log("Assistant created with ID:", assistant_id);
  // Llama a la función create_assistant y espera su resultado
}
initializeAssistant();

//  =============       Ruta START     ===========   //

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

// Definir la ruta POST
app.post("/chat", async (req, res) => {
  const { messages } = req.body; // Desestructurar el cuerpo de la solicitud para obtener messages

  const preguntaUsuario = messages.content; // Acceder al contenido del primer mensaje

  try {
    const completion = await client.chat.completions.create({
      model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M", // Tu modelo fine-tuned
      messages: [
        {
          role: "user",
          content: preguntaUsuario,
        },
      ],
    });

    //Enviar la respuesta al cliente
    res.json({
      respuesta: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: error.message }); // Enviar un error al cliente
  }
});

//==================   Puerto de escucha  3000  ======= //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
