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

//====================================================================//
//============    pruebas  llamado a open AI  ======================//

// const openai = new OpenAI();
// async function main(appointments) {
//   console.log("hola seba", appointments);
//   if (!Array.isArray(appointments)) {
//     throw new Error('Appointments must be an array');
//   }

//   const formattedAppointments = JSON.stringify(appointments, null, 2);
//   const stream = await openai.chat.completions.create({
//     model: "gpt-4o-mini",
//     messages: [
//       {
//         role: "user",
//         content:
//           "can you please let me know all the appointmets in the list ?? and also , tell me if you have a spot for the 8/1 at 11 ",
//       },
//       {
//         role: "system",
//         content: `Here are the already booked appointments so you dont overshchedule: ${formattedAppointments}`,
//       },
//     ],
//     stream: true,
//   });
//   for await (const chunk of stream) {
//     process.stdout.write(chunk.choices[0]?.delta?.content || "");
//   }
// }

//==================================================================================//

// This creates our central storage for appointments data
const AppointmentStore = {
  appointments: null,
  setAppointments: function (data) {
    this.appointments = data;
  },
  getAppointments: function () {
    return this.appointments;
  },
};

//=============================================================//
//==================   Ruta START   ===================//

// app.get("/start", async (req, res) => {
//   try {
//     // Crea un nuevo "thread" (hilo de conversación) usando la API de OpenAI
//     const thread = await client.beta.threads.create();

//     // Registra el ID del nuevo thread en la consola
//     console.log("Seba: New conversation started with thread ID:", thread.id);

//     // Devuelve el ID del thread al cliente
//     res.json({ thread_id: thread.id, mensaje: "seba" });

//     // Manejo de errores
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: " Seba: Internal server error" });
//   }
// });

//==================================================================//
//==================         Ruta START 2.0     =================  //

//============= <>
class ConversationStore {
  constructor() {
    // Usamos el thread.id como clave en lugar del nombre del usuario
    this.conversations = new Map();
    // Podemos agregar un mapeo de thread.id a información adicional si es necesario
    this.threadMetadata = new Map();
  }

  initializeThread(threadId, initialMetadata = {}) {
    this.conversations.set(threadId, []);
    this.threadMetadata.set(threadId, {
      createdAt: new Date(),
      lastActivity: new Date(),
      ...initialMetadata,
    });
  }

  addExchange(threadId, userMessage, gptResponse) {
    if (!this.conversations.has(threadId)) {
      // Si por alguna razón el thread no está inicializado, lo hacemos
      this.initializeThread(threadId);
    }

    const conversation = this.conversations.get(threadId);

    conversation.push({
      user: userMessage,
      gpt: gptResponse,
      timestamp: new Date(),
    });

    // Actualizamos el timestamp de última actividad
    this.threadMetadata.get(threadId).lastActivity = new Date();

    // Mantenemos un límite de historial
    if (conversation.length > 10) {
      conversation.shift();
    }
  }

  getConversation(threadId) {
    return this.conversations.get(threadId) || [];
  }

  getFormattedHistory(threadId) {
    const conversation = this.getConversation(threadId);
    return conversation.flatMap((exchange) => [
      { role: "user", content: exchange.user },
      { role: "assistant", content: exchange.gpt },
    ]);
  }

  // Método útil para limpiar conversaciones antiguas
  cleanup(maxAgeHours = 24) {
    const now = new Date();
    for (const [threadId, metadata] of this.threadMetadata.entries()) {
      const hoursSinceLastActivity =
        (now - metadata.lastActivity) / (1000 * 60 * 60);

      if (hoursSinceLastActivity > maxAgeHours) {
        this.conversations.delete(threadId);
        this.threadMetadata.delete(threadId);
      }
    }
  }
}

// Creamos una instancia global
const conversationStore = new ConversationStore();
// ============= </>

app.get("/start", async (req, res) => {
  try {
    // First, create the thread as you were doing before
    const thread = await client.beta.threads.create();
    console.log("New conversation started with thread ID:", thread.id);

    //============ <>

    // Inicializamos el almacenamiento para este thread
    conversationStore.initializeThread(thread.id, {
      startTime: new Date(),
    });

    //============ </>

    // Now, let's fetch appointments from Calendly
    const user =
      "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";
    const appointments = [];

    // We're keeping your three-week structure
    const weeks = [
      {
        start: new Date(),
        end: new Date(new Date().setDate(new Date().getDate() + 7)),
      },
      {
        start: new Date(new Date().setDate(new Date().getDate() + 7)),
        end: new Date(new Date().setDate(new Date().getDate() + 14)),
      },
      {
        start: new Date(new Date().setDate(new Date().getDate() + 14)),
        end: new Date(new Date().setDate(new Date().getDate() + 21)),
      },
    ];

    // Fetch appointments for each week
    for (const week of weeks) {
      //   const  weeeksIndex = weeks[i]
      const response = await axios.get(
        "https://api.calendly.com/user_busy_times",
        {
          params: {
            user,
            start_time: week.start.toISOString(),
            end_time: week.end.toISOString(),
          },
          headers: {
            Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`,
            "Content-Type": "application/json",
          },
        }
      );

      const collection = response.data.collection;
      for (let index = 0; index < collection.length; index++) {
        const appointment = collection[index];
        appointments.push([
          { appointment_numero: index },
          { startTime: appointment.buffered_start_time },
          { endTime: appointment.buffered_end_time },
        ]);
      }
    }

    // Store the appointments in our AppointmentStore
    AppointmentStore.setAppointments(appointments);

    // Send back both the thread ID and confirmation that appointments were loaded
    res.json({
      thread_id: thread.id,
      appointments_loaded: true,
      message: "Conversation started and appointments loaded successfully",
      appointments: appointments,
    });
  } catch (error) {
    console.error("Error in /start route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==================      Ruta CHAT    ================ //

// Definir la ruta POST
// app.post("/chat", async (req, res) => {
//   const { messages, first_name } = req.body; // Desestructurar el cuerpo de la solicitud para obtener messages
//   if (!first_name) {
//     first_name = "Sebastiansito";
//   }
//   const preguntaUsuario = messages.content; // Acceder al contenido del primer mensaje

//   try {
//     const completion = await client.chat.completions.create({
//       model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M", // Tu modelo fine-tuned
//       messages: [
//         { role: "system", content: `The user's name is ${first_name}.` },
//         {
//           role: "user",
//           content: preguntaUsuario,
//         },
//       ],
//     });

//     //Enviar la respuesta al cliente
//     res.json({
//       respuesta: completion.choices[0].message.content,
//     });
//   } catch (error) {
//     console.error("Error:", error.message);
//     res.status(500).json({ error: error.message }); // Enviar un error al cliente
//   }
// });

// ===================      Ruta Chat 2.0     =========================== //
let disable = false;
if (disable === false) {
  app.post("/chat", async (req, res) => {
    const { messages, nombre } = req.body;
    const preguntaUsuario = messages.content;

    try {
      // Get the current appointments from our store
      const currentAppointments = AppointmentStore.getAppointments();

      // Format the appointments for the system message
      const appointmentsInfo = currentAppointments
        ? `Available appointment information: ${JSON.stringify(
            currentAppointments,
            null,
            2
          )}`
        : "No appointment information available";

      const completion = await client.chat.completions.create({
        model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M",
        messages: [
          {
            role: "system",
            content: `The user's name is ${nombre}. and the appointments list is ${appointmentsInfo}`,
          },
          {
            role: "user",
            content: preguntaUsuario,
            // content: " me podes nobrar los appointments que ya tenes por favor  ??"
          },
        ],
      });

      res.json({
        respuesta: completion.choices[0].message.content,
        appointmentsInfo: appointmentsInfo,
      });
    } catch (error) {
      console.error("Error in /chat route:", error);
      res.status(500).json({ error: error.message });
    }
  });
}
//==================   Puerto de escucha  3000  ======= //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
