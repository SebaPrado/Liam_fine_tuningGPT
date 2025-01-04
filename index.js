//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

require("dotenv").config();
const ngrok = require("@ngrok/ngrok");
const axios = require("axios");

const express = require("express");
const OpenAI = require("openai");
// const functions = require("./functions");
const { log } = require("console");

// Configuración inicial
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

// // ==========   2)  Crear o cargar el ID del asistente    =========== //

// let assistant_id; // variable para almacenar el assistant_id
// async function initializeAssistant() {
//   assistant_id = await functions.create_assistant(client);
//   console.log("Assistant created with ID:", assistant_id);
//   // Llama a la función create_assistant y espera su resultado
// }
// initializeAssistant();

//  =============       Ruta USER BUSY TIMES      ===========   //

app.get("/user_busy_times_1stWeek", async (req, res) => {
  try {
    // Define los parámetros de la consulta
    const start_time = new Date();
    console.log("hoy es : ", start_time);
    const end_time = new Date(start_time);
    end_time.setDate(start_time.getDate() + 7);
    console.log("manana es : ", end_time);
    const user =
      "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";

    // const start_time = todaysDate;
    // const end_time = end_time;

    // Realiza la llamada a la API externa usando axios
    const response = await axios.get(
      "https://api.calendly.com/user_busy_times",
      {
        params: {
          user,
          start_time,
          end_time,
        },
        headers: {
          Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`, // Reemplaza con tu token válido de Calendly
          "Content-Type": "application/json",
        },
      }
    );
    // Registra la respuesta en la consola
    // console.log("Respuesta de Calendly:", response.data);
    const collection = response.data.collection;
    // console.log("esto es collection : ", collection);
    const appointments = [];

    for (let index = 0; index < collection.length; index++) {
      const appointment = collection[index];
      appointments.push([
        { appointment_numero: index },
        { startTime: appointment.buffered_start_time },
        { endTime: appointment.buffered_end_time },
      ]);
    }

    // Devuelve la respuesta al cliente
    res.json(appointments);

    // Manejo de errores
  } catch (error) {
    console.error("Error al consultar la API de Calendly:", error.message);
    res.status(500).json({ error: "Error interno al consultar Calendly" });
  }
});

console.log("la variable start fuera de la funcion : ", start_time );
console.log("la variable end fuera de la funcion : ", end_time );

//==================================================================================

//  =============       Ruta START     ===========   //

app.get("/start", async (req, res) => {
  try {
    // Crea un nuevo "thread" (hilo de conversación) usando la API de OpenAI
    const thread = await client.beta.threads.create();

    // Registra el ID del nuevo thread en la consola
    console.log("Seba: New conversation started with thread ID:", thread.id);

    // Devuelve el ID del thread al cliente
    res.json({ thread_id: thread.id, mensaje: "seba" });

    // Manejo de errores
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: " Seba: Internal server error" });
  }
});

// ==================      Ruta CHAT    ================ //

// Definir la ruta POST
app.post("/chat", async (req, res) => {
  const { messages, first_name } = req.body; // Desestructurar el cuerpo de la solicitud para obtener messages
  if (!first_name) {
    first_name = "Sebastiansito";
  }
  const preguntaUsuario = messages.content; // Acceder al contenido del primer mensaje

  try {
    const completion = await client.chat.completions.create({
      model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M", // Tu modelo fine-tuned
      messages: [
        { role: "system", content: `The user's name is ${first_name}.` },
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
