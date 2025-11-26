//SECCIÓN 1: IMPORTS Y CONFIGURACIÓN INICIAL

import dotenv from "dotenv";
import express from "express";
import OpenAI from "openai";
import cors from "cors";

import { obtenerUsuarioDeBaseDeDatos } from "./functions/database_functions.js";
import { crear_Usuario_en_DB } from "./functions/database_functions.js";
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
const corsOptions = {
  origin: "*", // Permite solicitudes desde cualquier origen
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Métodos permitidos
  credentials: true, // Permite el envío de cookies o autenticación
  optionsSuccessStatus: 204, // Respuesta para solicitudes OPTIONS
};

app.use(cors(corsOptions)); // Aplica la configuración de CORS

// Servir archivos estáticos desde la carpeta public
app.use(express.static('public'));

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
//// =====================================     ⬇️    Ruta raíz (/)     ⬇️     ===================================== //
/// =================================================================================================================== //

app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Backend OpenAI API</title>
      <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    </head>
    <body style="font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background-color: #f5f5f5;">
      <h1 style="color: #333;">Backend OpenAI API</h1>
      <p style="color: #666;">API backend para integración con OpenAI y WhatsApp.</p>
      <h2 style="color: #333; margin-top: 30px;">Endpoints disponibles:</h2>
      <ul style="color: #666; line-height: 1.8;">
        <li><strong>GET</strong> /pause_status/:whatsapp_Id</li>
        <li><strong>POST</strong> /whatsapp</li>
        <li><strong>POST</strong> /check</li>
        <li><strong>POST</strong> /pause</li>
        <li><strong>POST</strong> /script_chat</li>
      </ul>
    </body>
    </html>
  `);
});

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
    const assistantId = "asst_3J9tx1NLfoxBf4JnuXi9w3Ec";

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
      content: mensaje,
      //` 1) Mensaje del cliente/paciente : ${mensaje}.
      //   2) Información del paciente actual:
      //   Nombre: ${nombrePaciente}
      //   Link-enlace de agendamiento para la consulta: ${CalendlyURL}`,
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
      console.log(
        `Intento ${intentos + 1}: runStatus.status = ${runStatus.status}`
      );

      if (runStatus.status === "completed") {
        const messages = await client.beta.threads.messages.list(threadId);
        const respuesta =
          messages.data[0]?.content[0]?.text?.value || "Sin respuesta";
        console.log("...respuesta 'completed'.. ", respuesta);

        return res.json({
          status: "completed..",
          respuesta: respuesta,
        });
      } else if (["failed", "expired"].includes(runStatus.status)) {
        return res.json({
          status: "failed -expired..",
          respuesta: "failed - expired status",
          error: "La ejecución falló",
        });
      }

      // Si no está completado o fallido, esperar y volver a intentar
      console.log(
        `Estado no finalizado (${runStatus.status}), esperando ${
          delay / 1000
        } segundos...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      intentos++;
    }

    // Si el estado nunca fue "completed" después de los intentos
    return res.json({
      status: "processing",
      respuesta:
        "El estado sigue siendo 'in_progress' o 'queued' después de múltiples intentos",
      message: "Aún procesando",
    });
  } catch (error) {
    console.error("Error en /check: ", error.message);
    return res.status(500).json({ error: error.message });
  }
});

/// =================================================================================================================== //
//// =====================================      ⬇️    Ruta / pause     ⬇️      ======================================= //
/// =================================================================================================================== //

app.post("/pause", async (req, res) => {
  let number_to_be_paused = req.body.number_to_pause;
  console.log("number to be paused", number_to_be_paused);

  let resultadopauseUser = await pauseUser(number_to_be_paused);

  return res.json({
    resultadopauseUser, // Esto enviará el resultado obtenido de pauseUser
  });
});

/// =================================================================================================================== //
//// =====================================      ⬇️    Ruta / script_chat     ⬇️      ======================================= //
/// =================================================================================================================== //

//=======================================================================================================================//
//=======================================================================================================================//

// Configuración de Supabase
const SUPABASE_URL = 'https://bvdrogzfvzzcnibnzvmy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2ZHJvZ3pmdnp6Y25pYm56dm15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NDAzMjgsImV4cCI6MjA1ODIxNjMyOH0.nYvOxNSJod1unLUXVIOYYsaD5ft-1ESr-g5qWcDiZus';

// Función para consultar cupos disponibles en Supabase
// const obtenerCuposDisponibles = async (fecha) => {
//   try {
//     console.log(`📅 Consultando cupos para fecha: ${fecha}`);
    
//     const url = `${SUPABASE_URL}/rest/v1/rpc/leercupos`;
    
//     const response = await fetch(url, {
//       method: 'POST',
//       headers: {
//         'apikey': SUPABASE_KEY,
//         'Authorization': `Bearer ${SUPABASE_KEY}`,
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ fecha_param: fecha })
//     });

//     const cupos = await response.json();

//     if (!response.ok) {
//       console.error('❌ Error en la llamada a Supabase:', cupos);
//       throw new Error('No se pudieron obtener los cupos de Supabase');
//     }

//     console.log(`✅ Cupos encontrados: ${cupos.length}`);
    
//     return {
//       success: true,
//       fecha: fecha,
//       cantidad: cupos.length,
//       cupos: cupos
//     };

//   } catch (error) {
//     console.error('🚨 Error al conectar con Supabase:', error);
    
//     return {
//       success: false,
//       error: error.message,
//       fecha: fecha
//     };
//   }
// };

// Función para obtener cupo según whatsapp desde Supabase
const obtenerCupoSegunWhatsapp = async (whatsapp) => {
  try {
    console.log(`📱 Consultando cupo para whatsapp: ${whatsapp}`);
    
    const url = `${SUPABASE_URL}/rest/v1/rpc/obtener_cupo_segun_whatsapp`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ whatsapp_param: whatsapp })
    });

    const resultado = await response.json();

    if (!response.ok) {
      console.error('❌ Error en la llamada a Supabase:', resultado);
      throw new Error('No se pudo consultar el cupo');
    }

    console.log(`✅ Resultado:`, resultado);
    return resultado;

  } catch (error) {
    console.error('🚨 Error al conectar con Supabase:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

//=======================================================================================================================//
//=======================================================================================================================//

app.post("/script_chat", async (req, res) => {
  console.log(
    "------------------------------ /script_chat ----------------------------------"
  );

  try {
    let messages = req.body.messages;
    const sessionId = req.body.sessionId;
    let threadId = req.body.thread_id;
    const assistantId =
      req.body.assistantId || process.env.DEFAULT_ASSISTANT_ID;

    if (!assistantId) {
      return res.status(400).json({
        error:
          "assistantId no recibido. Envía assistantId en el cuerpo de la petición o configura DEFAULT_ASSISTANT_ID.",
      });
    }

    console.log(
      "[/script_chat] Payload recibido:",
      JSON.stringify(
        {
          sessionId,
          assistantId,
          hasThreadId: Boolean(threadId),
          mensajePreview:
            typeof messages === "string"
              ? messages.slice(0, 120)
              : typeof messages,
        },
        null,
        2
      )
    );

    // Crear thread si no existe
    if (!threadId) {
      const thread = await client.beta.threads.create();
      threadId = thread.id;
      console.log("threadId", threadId);
    }

    // Extraer datos de ManyChat
    const nombreUsuario = req.body.nombre || "Usuario";
    const whatsappUsuario = req.body.number || "+61487175193"; 

    console.log(`👤 Usuario: ${nombreUsuario} | WhatsApp: ${whatsappUsuario}`);

    // Crear mensaje enriquecido para el asistente
    const mensajeConContexto = `
Usuario: ${nombreUsuario}
WhatsApp: ${whatsappUsuario}
Mensaje: ${messages}
`.trim();

    // Crear mensaje en el thread
    await client.beta.threads.messages.create(threadId, {
      role: "user",
      content: mensajeConContexto,
    });

    // Crear run
    const run = await client.beta.threads.runs.create(threadId, {
      assistant_id: assistantId,
    });

    console.log("✅ Run creado:", run.id, "con status inicial:", run.status);

    // Retornar inmediatamente para evitar timeout de Vercel
    // El frontend debe hacer polling a /script_chat_check
    res.json({
      status: run.status,
      checkEndpoint: "/script_chat_check",
      processing_Run_Id: run.id,
      threadId: threadId,
      sessionId: sessionId,
    });
  } catch (error) {
    console.error("Error en /script_chat:", error);
    res.status(500).json({ error: error.message });
  }
});

// Función para obtener datos del clima
const obtenerFechaActual = async () => {
  try {
    const fecha = new Date();
    const opciones = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    const fechaFormateada = fecha.toLocaleDateString("es-ES", opciones);
    console.log("fecha", fechaFormateada);

    return {
      fecha: fechaFormateada,
    };
  } catch (error) {
    console.error("Error obteniendo la fecha:", error);
    throw new Error("No se pudo obtener la fecha actual");
  }
};

const cleanAIResponse = (response) => {
  // Usamos una expresión regular para encontrar y eliminar el patrón
  // El patrón busca:
  // - Texto que comienza con 【
  // - Seguido por cualquier carácter (números, letras, símbolos) hasta encontrar
  // - El cierre con 】
  const cleanedResponse = response.replace(/【[^】]*】/g, "");

  // Eliminamos espacios extra que pudieran quedar
  return cleanedResponse.trim();
};

// Endpoint para verificar el estado del run (el frontend hace el polling)
app.post("/script_chat_check", async (req, res) => {
  console.log(
    "------------------------------ /script_chat_check ----------------------------------"
  );

  try {
    const { runId, threadId } = req.body;
    console.log(`🔍 Verificando run ${runId} en thread ${threadId}`);

    // Obtener estado del run UNA SOLA VEZ
    let runStatus = await client.beta.threads.runs.retrieve(threadId, runId);
    console.log(`🔄 Estado actual: ${runStatus.status}`);

    // Manejar function calling si es necesario
    if (runStatus.status === "requires_action") {
      console.log("⚙️  Run requiere acción (function calling)");
      
      const toolCalls =
        runStatus.required_action.submit_tool_outputs.tool_calls;

      const toolOutputs = await Promise.all(
        toolCalls.map(async (toolCall) => {
          // Función: obtener fecha actual
          if (toolCall.function.name === "get_current_date") {
            const dateResponse = await obtenerFechaActual();
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(dateResponse),
            };
          }

          // Función: obtener cupo según whatsapp
          if (toolCall.function.name === "obtenerCupoSegunWhatsapp") {
            const args = JSON.parse(toolCall.function.arguments);
            
            console.log(`📱 Asistente solicita cupo para whatsapp:`, args.whatsapp);
            
            const cupoResponse = await obtenerCupoSegunWhatsapp(args.whatsapp);
            
            console.log(`📦 Resultado de obtenerCupoSegunWhatsapp:`, {
              success: cupoResponse.success,
              tiene_codigo: !!cupoResponse.cupo?.codigo
            });
            
            return {
              tool_call_id: toolCall.id,
              output: JSON.stringify(cupoResponse)
            };
          }

          throw new Error(
            `Función no reconocida: ${toolCall.function.name}`
          );
        })
      );

      // Enviar resultados y obtener el nuevo estado
      console.log(`📤 Enviando ${toolOutputs.length} tool output(s)...`);
      runStatus = await client.beta.threads.runs.submitToolOutputs(
        threadId,
        runId,
        { tool_outputs: toolOutputs }
      );
      console.log(`✅ Tool outputs enviados. Nuevo status: ${runStatus.status}`);
    }

    // Verificar si está completado
    if (runStatus.status === "completed") {
      const messages = await client.beta.threads.messages.list(threadId);
      const respuesta =
        messages.data[0]?.content[0]?.text?.value || "Sin respuesta";
      console.log("✅ Respuesta completada:", respuesta.slice(0, 100) + "...");

      const respuesta2 = cleanAIResponse(respuesta);

      return res.json({
        status: "completed",
        response: respuesta2,
      });
    }

    // ⭐ Capturar el error detallado cuando falla
    if (["failed", "expired", "cancelled"].includes(runStatus.status)) {
      console.error(`❌ Run ${runStatus.status}`);

      // Extraer información detallada del error
      const errorInfo = {
        status: runStatus.status,
        last_error: runStatus.last_error || null,
        failed_at: runStatus.failed_at || null,
        incomplete_details: runStatus.incomplete_details || null,
      };

      // Log detallado para debugging
      console.error(
        "📋 Detalles completos del error:",
        JSON.stringify(errorInfo, null, 2)
      );

      // Construir mensaje de error más descriptivo
      let errorMessage = `El run ha ${runStatus.status}`;
      if (runStatus.last_error) {
        errorMessage += `: ${runStatus.last_error.message}`;
        console.error(`🔴 Código de error: ${runStatus.last_error.code}`);
      }

      return res.json({
        status: "failed",
        error: errorMessage,
        errorDetails: errorInfo, // ⭐ Incluir detalles para el frontend
      });
    }

    // Si aún está procesando, simplemente retornar el estado
    return res.json({
      status: "processing",
      message: `Estado actual: ${runStatus.status}`,
    });
  } catch (error) {
    console.error("❌ Error en /script_chat_check:", error.message);
    return res.status(500).json({
      status: "failed",
      error: error.message,
    });
  }
});
// =========================================================================================== //
//=============================       Puerto de escucha  3000        ========================= //
// =========================================================================================== //

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
