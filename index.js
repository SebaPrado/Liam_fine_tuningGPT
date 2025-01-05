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

//  =============       Ruta USER BUSY TIMES de aca a 21 Dias     ===========   //

// const appointments = [];

// app.get("/user_busy_times_1stWeek", async (req, res) => {
//   try {
//     // Define los parámetros de la consulta
//     const start_time = new Date();
//     console.log("hoy es : ", start_time);
//     const end_time = new Date(start_time);
//     end_time.setDate(start_time.getDate() + 7);
//     console.log("manana es : ", end_time);
//     const user =
//       "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";

//     // const start_time = todaysDate;
//     // const end_time = end_time;

//     // Realiza la llamada a la API externa usando axios
//     const response = await axios.get(
//       "https://api.calendly.com/user_busy_times",
//       {
//         params: {
//           user,
//           start_time,
//           end_time,
//         },
//         headers: {
//           Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`, // Reemplaza con tu token válido de Calendly
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     // Registra la respuesta en la consola
//     // console.log("Respuesta de Calendly:", response.data);
//     const collection = response.data.collection;
//     // console.log("esto es collection : ", collection);
//     // const appointments = [];

//     for (let index = 0; index < collection.length; index++) {
//       const appointment = collection[index];
//       appointments.push([
//         { appointment_numero: index },
//         { startTime: appointment.buffered_start_time },
//         { endTime: appointment.buffered_end_time },
//       ]);
//     }

//     // Devuelve la respuesta al cliente
//     res.json(appointments);

//     // Manejo de errores
//   } catch (error) {
//     console.error("Error al consultar la API de Calendly:", error.message);
//     res.status(500).json({ error: "Error interno al consultar Calendly" });
//   }
// });
// app.get("/user_busy_times_2ndWeek", async (req, res) => {
//   try {
//     // Define los parámetros de la consulta
//     const start_time = new Date();
//     start_time.setDate(start_time.getDate() + 7); // Cambiado para sumar 7 días
//     console.log("en siete dias sera : ", start_time);
//     const end_time = new Date(start_time);
//     end_time.setDate(start_time.getDate() + 7);
//     console.log("en 14 dias es : ", end_time);
//     const user =
//       "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";

//     // const start_time = todaysDate;
//     // const end_time = end_time;

//     // Realiza la llamada a la API externa usando axios
//     const response = await axios.get(
//       "https://api.calendly.com/user_busy_times",
//       {
//         params: {
//           user,
//           start_time,
//           end_time,
//         },
//         headers: {
//           Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`, // Reemplaza con tu token válido de Calendly
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     // Registra la respuesta en la consola
//     // console.log("Respuesta de Calendly:", response.data);
//     const collection = response.data.collection;
//     // console.log("esto es collection : ", collection);
//     //   const appointments = [];

//     for (let index = 0; index < collection.length; index++) {
//       const appointment = collection[index];
//       appointments.push([
//         { appointment_numero: index },
//         { startTime: appointment.buffered_start_time },
//         { endTime: appointment.buffered_end_time },
//       ]);
//     }

//     // Devuelve la respuesta al cliente
//     res.json(appointments);

//     // Manejo de errores
//   } catch (error) {
//     console.error("Error al consultar la API de Calendly:", error.message);
//     res.status(500).json({ error: "Error interno al consultar Calendly" });
//   }
// });
// app.get("/user_busy_times_3rdWeek", async (req, res) => {
//   try {
//     // Define los parámetros de la consulta
//     const start_time = new Date();
//     start_time.setDate(start_time.getDate() + 14); // Cambiado para sumar 7 días
//     console.log("en 14 dias sera : ", start_time);
//     const end_time = new Date(start_time);
//     end_time.setDate(start_time.getDate() + 7);
//     console.log("en 21 dias es : ", end_time);
//     const user =
//       "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";

//     // const start_time = todaysDate;
//     // const end_time = end_time;

//     // Realiza la llamada a la API externa usando axios
//     const response = await axios.get(
//       "https://api.calendly.com/user_busy_times",
//       {
//         params: {
//           user,
//           start_time,
//           end_time,
//         },
//         headers: {
//           Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`, // Reemplaza con tu token válido de Calendly
//           "Content-Type": "application/json",
//         },
//       }
//     );
//     // Registra la respuesta en la consola
//     // console.log("Respuesta de Calendly:", response.data);
//     const collection = response.data.collection;
//     // console.log("esto es collection : ", collection);
//     //   const appointments = [];

//     for (let index = 0; index < collection.length; index++) {
//       const appointment = collection[index];
//       appointments.push([
//         { appointment_numero: index },
//         { startTime: appointment.buffered_start_time },
//         { endTime: appointment.buffered_end_time },
//       ]);
//     }

//     // Devuelve la respuesta al cliente
//     res.json(appointments);

//     // Manejo de errores
//   } catch (error) {
//     console.error("Error al consultar la API de Calendly:", error.message);
//     res.status(500).json({ error: "Error interno al consultar Calendly" });
//   }
// });
// console.log("la variable start fuera de la funcion : ", start_time );
// console.log("la variable end fuera de la funcion : ", end_time );

//  =============       Ruta USER BUSY TIMES para las tres semanas     ===========   //

// var appointments2 = [];
// let appointments = []; // Array para almacenar todas las citas
// app.get("/user_busy_times_123Weeks", async (req, res) => {
//   try {
//     const user =
//       "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";

//     // Definir los tiempos de inicio y fin para cada semana
//     const weeks = [
//       {
//         start: new Date(),
//         end: new Date(new Date().setDate(new Date().getDate() + 7)),
//       }, // 1st week
//       {
//         start: new Date(new Date().setDate(new Date().getDate() + 7)),
//         end: new Date(new Date().setDate(new Date().getDate() + 14)),
//       }, // 2nd week
//       {
//         start: new Date(new Date().setDate(new Date().getDate() + 14)),
//         end: new Date(new Date().setDate(new Date().getDate() + 21)),
//       }, // 3rd week
//     ];

//     // Llamar a la API para cada semana
//     for (const week of weeks) {
//       const response = await axios.get(
//         "https://api.calendly.com/user_busy_times",
//         {
//           params: {
//             user,
//             start_time: week.start.toISOString(), // Convertir a ISO string
//             end_time: week.end.toISOString(), // Convertir a ISO string
//           },
//           headers: {
//             Authorization: `Bearer ${process.env.CALENDLY_TOKEN_AQUI}`,
//             "Content-Type": "application/json",
//           },
//         }
//       );

//       const collection = response.data.collection;

//       for (let index = 0; index < collection.length; index++) {
//         const appointment = collection[index];
//         appointments.push([
//           { appointment_numero: index },
//           { startTime: appointment.buffered_start_time },
//           { endTime: appointment.buffered_end_time },
//         ]);
//       }
//     }

//     // Devuelve la respuesta al cliente
//     res.json(appointments);
//     console.log("weeks", weeks);
//     console.log("array1 appointments:", appointments);

//     // Llama a la función main después de llenar appointments
//     await main(appointments); // Pasa appointments a la función main
//   } catch (error) {
//     console.error("Error al consultar la API de Calendly:", error.message);
//     res.status(500).json({ error: "Error interno al consultar Calendly" });
//   }
// });

// console.log("array2 appointments:", appointments);

//======================================

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
    setAppointments: function(data) {
        this.appointments = data;
    },
    getAppointments: function() {
        return this.appointments;
    }
};

//  =============       Ruta START     ===========   //

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

app.get("/start", async (req, res) => {
    try {
        // First, create the thread as you were doing before
        const thread = await client.beta.threads.create();
        console.log("New conversation started with thread ID:", thread.id);

        // Now, let's fetch appointments from Calendly
        const user = "https://api.calendly.com/users/02a6492f-deee-4196-bf24-075f4b3c7870";
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
            message: "Conversation started and appointments loaded successfully" 
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

// ================    Ruta Chat 2.0     ================================ //

app.post("/chat", async (req, res) => {
    const { messages, first_name = "Sebastiansito" } = req.body;
    const preguntaUsuario = messages.content;

    try {
        // Get the current appointments from our store
        const currentAppointments = AppointmentStore.getAppointments();
        
        // Format the appointments for the system message
        const appointmentsInfo = currentAppointments 
            ? `Available appointment information: ${JSON.stringify(currentAppointments, null, 2)}`
            : "No appointment information available";

        const completion = await client.chat.completions.create({
            model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M",
            messages: [
                { 
                    role: "system", 
                    content: `The user's name is ${first_name}. ${appointmentsInfo}` 
                },
                {
                    role: "user",
                    content: preguntaUsuario,
                },
            ],
        });

        res.json({
            respuesta: completion.choices[0].message.content,
        });
    } catch (error) {
        console.error("Error in /chat route:", error);
        res.status(500).json({ error: error.message });
    }
});

//==================   Puerto de escucha  3000  ======= //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
