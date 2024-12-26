const { OpenAI } = require("openai");
const functions = require("./functions");
require("dotenv").config();

async function testAssistant() {
  try {
    // Inicializar el cliente de OpenAI
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Crear o cargar el asistente
    const assistant_id = await functions.create_assistant(client);
    console.log("Assistant ID:", assistant_id);

    // Crear un thread
    const thread = await client.beta.threads.create();

    // Enviar un mensaje de prueba
    await client.beta.threads.messages.create(thread.id, {
      role: "user",
      content: "Hola, ¿qué servicios ofrece el hotel?",
    });

    // Ejecutar el asistente
    const run = await client.beta.threads.runs.create(thread.id, {
      assistant_id: assistant_id,
    });

    // Esperar la respuesta
    let runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    while (runStatus.status !== "completed") {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      runStatus = await client.beta.threads.runs.retrieve(thread.id, run.id);
    }

    // Obtener la respuesta
    const messages = await client.beta.threads.messages.list(thread.id);
    console.log(
      "\nRespuesta del asistente:",
      messages.data[0].content[0].text.value
    );
  } catch (error) {
    console.error("Error en la prueba:", error);
  }
}

testAssistant();
