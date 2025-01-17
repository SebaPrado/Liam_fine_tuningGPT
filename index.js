//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

import dotenv from "dotenv";
import axios from "axios";
import express from "express";
import OpenAI from "openai";
import ngrok from "@ngrok/ngrok";

import {
  obtenerUsuarioDeBaseDeDatos,
  crear_Usuario_en_DB,
} from "./database.js";

// const functions = require("./functions");

dotenv.config(); // Cargar dotenv al inicio

// Configuración inicial
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const app = express();
app.use(express.json());

const client = new OpenAI({ apiKey: OPENAI_API_KEY });

/// ====================================================================================== //
/// ====================================================================================== //
//// ================     ⬇️    Definimos Mes, Año y CalendlyURL     ⬇️     ==================== //
/// ===================================================================================== //
/// ====================================================================================== //

let mesActual = new Date().getMonth() + 1; //  mes actual (0-11)
let añoActual = new Date().getFullYear(); //   año actual

// console.log("mes", mesActual);
// console.log("año", añoActual);

mesActual = mesActual < 10 ? "0" + mesActual : "" + mesActual;
console.log("1 mes corregido", mesActual);

const CalendlyURL = `https://calendly.com/sebastian-pradomelesi/30min?back=1&month=${añoActual}-${mesActual}`;
// console.log(CalendlyURL);

/// ====================================================================================== //
/// ====================================================================================== //
//// =======    ⬇️    menssage.create - runs.create - runs.retrieve    ⬇️     ============ //
/// ===================================================================================== //
/// ====================================================================================== //
// async function main() {
//   try {
//     async function interactuarConNora(threadId, mensaje, assistantId) {
//       // 1. Crear el mensaje en el thread
//       console.log("N) thread id usado con Nora ", threadId);

//       await client.beta.threads.messages.create(threadId, {
//         role: "user",
//         content: mensaje,
//       });

//       // 2. Ejecutar el assistant
//       const run = await client.beta.threads.runs.create(threadId, {
//         assistant_id: assistantId,
//       });

//       // 3. Esperar a que el run se complete
//       let runStatus;
//       do {
//         runStatus = await client.beta.threads.runs.retrieve(threadId, run.id);
//         if (runStatus.status === "failed") {
//           throw new Error("La ejecución falló");
//         }
//         if (runStatus.status !== "completed") {
//           await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar 1 segundo
//         }
//       } while (runStatus.status !== "completed");

//       // 4. Obtener los mensajes más recientes
//       const messages = await client.beta.threads.messages.list(threadId);

//       // 5. El mensaje más reciente (el primero en la lista) será la respuesta del assistant
//       return messages.data[0].content[0].text.value;
//     }
//     let threadId = "thread_te0THOv5OO57xnDcA8Hb5O0K";
//     let assistantId = "asst_sBmjedCg1l72PZtXnJWN7Jk0";
//     let mensaje = " que hora abren los sabados ?";

//     const respuesta = await interactuarConNora(threadId, mensaje, assistantId);
//     console.log("respuesta de nora: ", respuesta);
//   } catch (error) {
//     console.error("Error en la ejecución principal:", error);
//   }
// }

// main();
// ===================================================================================================//

// Primera ruta - Inicia el proceso
app.post("/whatsapp", async (req, res) => {
    console.log("arranco /whatapp");
    
  try {
    const mensaje = req.body.messages.content;
    const whatsapp_Id = req.body.whatsapp_id;
    const assistantId = "asst_sBmjedCg1l72PZtXnJWN7Jk0";

    // Obtener o crear usuario/thread (esto es rápido)
    const usuarioDatabase = await obtenerUsuarioDeBaseDeDatos(whatsapp_Id);
    let user_threadId;

    if (usuarioDatabase) {
      user_threadId = usuarioDatabase.Thread_id;
    } else {
      const thread = await client.beta.threads.create();
      user_threadId = thread.id;
      await crear_Usuario_en_DB(whatsapp_Id, user_threadId);
    }

    //  Crear el mensaje en el thread antes de iniciar el run
    await client.beta.threads.messages.create(user_threadId, {
        role: "user",
        content: mensaje
      });

    // Iniciar el proceso con OpenAI pero NO esperar a que termine
    const run = await client.beta.threads.runs.create(user_threadId, {
      assistant_id: assistantId,
    });

    // Guardar información necesaria para el checkeo
    // const processingData = {
    //   runId: run.id,
    //   threadId: user_threadId,
    //   whatsappId: whatsapp_Id,
    // };

    // Responder inmediatamente (dentro de los 10 segundos)
    res.json({
      status: "processing",
      checkEndpoint: "/check",
      processing_Run_Id: run.id,
      threadId: user_threadId
    //   mensaje: mensaje
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Segunda ruta - Verifica el estado
app.post("/check", async (req, res) => {
    console.log("arranco /check");
  try {
    const { runId, threadId } = req.body;
    console.log( "runId :",runId, "threadId :", threadId);
    
    // Obtener estado del run
    const runStatus = await client.beta.threads.runs.retrieve(threadId, runId);

    if (runStatus.status === "completed") {
      // Si está completo, obtener la respuesta
      const messages = await client.beta.threads.messages.list(threadId);
      
      const respuesta = messages.data[0].content[0].text.value;
      
      console.log("...respuesta.. ", respuesta);
      
      res.json({
        status: "completed",
        respuesta: respuesta,
      });
    } else if (runStatus.status === "failed") {
      res.json({
        status: "failed",
        respuesta: "failed status",
        error: "La ejecución falló",
      });
    } else {
      console.log("...respuesta.. ", respuesta);

      res.json({
        status: "processing",
        respuesta: "processing status",
        message: "Aún procesando",
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//==================   Puerto de escucha  3000  ======= //
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
