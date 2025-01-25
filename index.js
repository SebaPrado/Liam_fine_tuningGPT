//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import ngrok from "@ngrok/ngrok";

import { obtenerUsuarioDeBaseDeDatos } from "./functions/database.js";
import { crear_Usuario_en_DB } from "./functions/database.js";
import { incrementCounter } from "./functions/incrementCounter.js";
import { pauseUser } from "./functions/pause_user.js";
import { handleExpiredRun } from "./functions/handleExpiredRun.js";
import { checkUserPauseStatus } from "./functions/checkUserPauseStatus.js";

// const functions = require("./functions");

dotenv.config(); // Cargar dotenv al inicio

// Configuración inicial
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

/// =================================================================================================================== //
//// ===========================     ⬇️    Definimos Mes, Año y CalendlyURL     ⬇️     ============================== //
/// =================================================================================================================== //

let mesActual = new Date().getMonth() + 1; //  mes actual (0-11)
let añoActual = new Date().getFullYear(); //   año actual
mesActual = mesActual < 10 ? "0" + mesActual : "" + mesActual;
const CalendlyURL = `https://calendly.com/sebastian-pradomelesi/30min?back=1&month=${añoActual}-${mesActual}`;
console.log(" 0.0) mes actual", mesActual);
console.log(" 0.1) link calendly ", CalendlyURL);

/// =================================================================================================================== //
//// =====================================     ⬇️    Ruta /pause_status     ⬇️     ===================================== //
/// =================================================================================================================== //

app.get("/pause_status/:whatsapp_Id", async (req, res) => {
  let whatsappId = req.params.whatsapp_Id;
  console.log(whatsappId);
  let pauseStatus = await checkUserPauseStatus(whatsappId);
  pauseStatus = pauseStatus.isPaused;
  res.json({ pauseStatus });
});

/// =================================================================================================================== //
//// =====================================     ⬇️    Ruta /whatsapp     ⬇️     ======================================= //
/// =================================================================================================================== //
app.post("/whatsapp", async (req, res) => {
  console.log(
    "------------------------------       / Whatsapp         ----------------------------------"
  );
  try {
    const mensaje = req.body.messages.content;
    const nombrePaciente = req.body.nombre;
    const whatsapp_Id = req.body.whatsapp_id;
    const assistantId = "asst_sBmjedCg1l72PZtXnJWN7Jk0";

    //============================    Obtengo  o creo THREAD  (Database)  =====================================//

    const usuarioDatabase = await obtenerUsuarioDeBaseDeDatos(whatsapp_Id);
    let user_threadId;

    if (usuarioDatabase) {
      user_threadId = usuarioDatabase.Thread_id;
      let count = usuarioDatabase.numero_de_interacciones;
      console.log("numero_de_interacciones:", count);
    } else {
      const thread = await client.beta.threads.create();
      user_threadId = thread.id;
      await crear_Usuario_en_DB(whatsapp_Id, user_threadId);
    }

    //=================         Creo nuevo mensaje al Thread existente(Open Ai)  +  incremento Counter (SebasApi)      ===================//
    // await client.beta.threads.messages.create(user_threadId, {
    //   role: "system",
    //   content: `Información del paciente actual:
    //              Nombre: ${nombrePaciente}
    //              Link-enlace de agendamiento para la consulta: ${CalendlyURL}`,
    // });
    await client.beta.threads.messages.create(user_threadId, {
      role: "user",
      content: ` 1) Mensaje del cliente/paciente : ${mensaje}.
      2) Información del paciente actual:
      Nombre: ${nombrePaciente}
      Link-enlace de agendamiento para la consulta: ${CalendlyURL}`,
    });
    await incrementCounter(whatsapp_Id);
    console.log(" 3.1) nombre paciente:", nombrePaciente);

    //=========================================   Creo Run (Open Ai)   ===========================================//

    let run = await client.beta.threads.runs.create(user_threadId, {
      assistant_id: assistantId,
    });

    //=========================================   adiciono  tiempo  ===========================================//

    //Esperar 3 segundos
    // console.log("Iniciando 1er retraso de 1 segundos");
    // await new Promise((resolve) => setTimeout(resolve, 1000));

    //====================================      verificamos  el  status      ====================================//
    // =====================   status : queued/in_progress/completed/failed/expired      ====================//

    let retrieveStatus = await client.beta.threads.runs.retrieve(
      user_threadId,
      run.id
    );

    console.log(" 5.1)runStatus.status", retrieveStatus.status);
    console.log(" 5.1)runStatus.id", retrieveStatus.id);

    //=========================             Enviamos res.json acorde al status             =========================//

    if (retrieveStatus.status === "expired") {
      console.log("6.A.1) estamos en el if('expired')... ");

      const newRunResult = await handleExpiredRun(
        client,
        user_threadId,
        assistantId
      );
      run.id = newRunResult.runId;
      retrieveStatus.status = newRunResult.status;
      console.log(
        "6.A.2) Nuevo run creado:",
        run.id,
        "con status:",
        retrieveStatus.status
      );

      console.log("Enviando respuesta con runId:", run.id);
      res.json({
        status: retrieveStatus.status,
        checkEndpoint: "/check.1",
        processing_Run_Id: run.id,
        threadId: user_threadId,
      });
    } else {
      console.log("6.B ) entramos en 'else(!expired)'... ");
      res.json({
        status: retrieveStatus.status,
        checkEndpoint: "/check.2",
        processing_Run_Id: run.id,
        threadId: user_threadId,
      });
    }

    //========================================             catch error          ============================================//
  } catch (error) {
    console.error("Error en /whatsapp:", error);
    res.status(500).json({ error: error.message });
  }
});

/// =================================================================================================================== //
//// =====================================      ⬇️    Ruta / check     ⬇️      ======================================= //
/// =================================================================================================================== //

// app.post("/check", async (req, res) => {
//   console.log(
//     "------------------------------       / Check         ----------------------------------"
//   );

//   try {
//     const { runId, threadId } = req.body;
//     console.log(`1)Verificando run ${runId} en thread ${threadId}`);

//     // Obtener estado del run
//     let runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
//     console.log("runStatus", runStatus.status);

//     /// ======================                   verificamos  el  status                        =============================== //
//     // ======================         status : queued/in_progress/completed/failed/expired          ============================//

//     // =======    1st try      ========//

//     if (runStatus.status === "completed") {
//       const messages = await client.beta.threads.messages.list(threadId);
//       const respuesta = messages.data[0].content[0].text.value;
//       console.log("...respuesta 'completed'.. ", respuesta);

//       return res.json({
//         status: "completed",
//         respuesta: respuesta,
//       });
//     } else if (
//       runStatus.status === "failed" ||
//       runStatus.status === "expired"
//     ) {
//       return res.json({
//         status: "failed - expired",
//         respuesta: "failed - expired status",
//         error: "La ejecución falló",
//       });
//     } else {
//       console.log(" respuesta inprgress o queued.. ", respuesta);
//       console.log("Iniciando 2o retraso de 3 segundos");
//       await new Promise((resolve) => setTimeout(resolve, 3000));
//       console.log("Retraso completado, enviando respuesta");
//     }

//     // =======    2nd try      ========//

//     console.log("corriendo runStatus por 2a vez...");
//     let runStatus2 = await client.beta.threads.runs.retrieve(threadId, runId);

//     if (runStatus2.status === "completed") {
//       console.log("runStatus por 2a vez = 'completed'");

//       const messages = await client.beta.threads.messages.list(threadId);
//       const respuesta = messages.data[0].content[0].text.value;

//       console.log("...2a respuesta 'completed'.. ", respuesta);

//       return res.json({
//         status: "2nd try : completed",
//         respuesta: respuesta,
//       });
//     } else if (
//       runStatus.status === "failed" ||
//       runStatus.status === "expired"
//     ) {
//       return res.json({
//         status: " 2nd try : failed - expired",
//         respuesta: "failed - expired status",
//         error: "La ejecución falló",
//       });
//     } else {
//       console.log("corriendo runStatus por 3a vez...");
      
//       console.log("Iniciando 3o retraso de 3 segundos");
//       await new Promise((resolve) => setTimeout(resolve, 3000));
//       console.log("Retraso completado, enviando respuesta");

//       runStatus2 = await client.beta.threads.runs.retrieve(threadId, runId);

//       if (runStatus2.status === "completed") {
//         console.log("runStatus por 3a vez = 'completed'");

//         const messages = await client.beta.threads.messages.list(threadId);
//         const respuesta = messages.data[0].content[0].text.value;

//         console.log("...3a respuesta 'completed'.. ", respuesta);

//         return res.json({
//           status: "3rd try : completed",
//           respuesta: respuesta,
//         });
//       } else if (
//         runStatus2.status === "failed" ||
//         runStatus2.status === "expired"
//       ) {
//         return res.json({
//           status: " 3rd try : failed - expired",
//           respuesta: "failed - expired status",
//           error: "La ejecución falló",
//         });
//       } else {
//         console.log("...3a respuesta 'else'.. ", respuesta);
//         return res.json({
//           status: "processing",
//           respuesta: "processing status",
//           message: "Aún procesando",
//         });
//       }
//     }
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// });

app.post("/check", async (req, res) => {
    console.log(
      "------------------------------       / Check         ----------------------------------"
    );
  
    try {
      const { runId, threadId } = req.body;
      console.log(`1) Verificando run ${runId} en thread ${threadId}`);
  
      let intentos = 0; // Contador para controlar los intentos
      let maxIntentos = 3; // Máximo de intentos permitidos
      let delay = 2750; // Tiempo de retraso entre intentos en milisegundos
      let runStatus;
  
      while (intentos < maxIntentos) {
        // Obtener estado del run
        runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
        console.log(`Intento ${intentos + 1}: runStatus.status = ${runStatus.status}`);
  
        if (runStatus.status === "completed") {
          const messages = await client.beta.threads.messages.list(threadId);
          const respuesta = messages.data[0]?.content[0]?.text?.value || "Sin respuesta";
          console.log("...respuesta 'completed'.. ", respuesta);
  
          return res.json({
            status: "completed",
            respuesta: respuesta,
          });
        } else if (["failed", "expired"].includes(runStatus.status)) {
          return res.json({
            status: "failed -expired",
            respuesta: "failed - expired status",
            error: "La ejecución falló",
          });
        }
  
        // Si no está completado o fallido, esperar y volver a intentar
        console.log(`Estado no finalizado (${runStatus.status}), esperando ${delay / 1000} segundos...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        intentos++;
      }
  
      // Si el estado nunca fue "completed" después de los intentos
      return res.json({
        status: "processing",
        respuesta: "El estado sigue siendo 'in_progress' o 'queued' después de múltiples intentos",
        message: "Aún procesando",
      });
    } catch (error) {
      console.error("Error en /check: ", error.message);
      return res.status(500).json({ error: error.message });
    }
  });
  

app.post("/pause", async (req, res) => {
  let number_to_be_paused = req.body.number_to_pause;
  console.log("number to be paused", number_to_be_paused);

  let resultadopauseUser = await pauseUser(number_to_be_paused);

  return res.json({
    resultadopauseUser, // Esto enviará el resultado obtenido de pauseUser
  });
});

//==================   Puerto de escucha  3000  ======= //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
