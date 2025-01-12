import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI();

//==============================          ⬇️         ================================//
/// ====== ⬇  Comentar si quiero usar un threadId y assistantID ya existente ⬇  ===== ///
/// ========  ⬇  Descomentar para crear un nuevo threadId y assistantID  ⬇  ========= ///
/// ========  ⬇  tambien descomentar linea87: await iniciarAsistente();  ⬇  ========= ///

//Guardamos los IDs como variables globales para este ejemplo
let assistantId;
let threadId;

// Función inicial para crear el asistente y el thread
async function iniciarAsistente() {
  // Crear el asistente (solo necesitas hacerlo una vez)
  const sebasAssistant = await openai.beta.assistants.create({
    name: "Mad Math Tutor",
    instructions:
      "You are a mad math tutor. do not answer questions, send them to study and figure it out by themselves. address the user as Elmatias once every 2 messages( response [0], [2], and so on...).",
    tools: [{ type: "code_interpreter" }],
    model: "gpt-4",
  });

  // Guardar el ID del asistente
  assistantId = sebasAssistant.id;
  console.log("ID del asistente guardado:", assistantId);

  // Crear el thread
  const thread = await openai.beta.threads.create();

  // Guardar el ID del thread
  threadId = thread.id;
  console.log("ID del thread guardado:", threadId);

  console.log("datos del asistente ", sebasAssistant);
}

//==============================          ⬆️          ================================//
//====================================================================================//

// Función para enviar un nuevo mensaje usando los IDs guardados
async function enviarMensaje(contenidoMensaje) {
  // let threadId = "thread_B73xErVG9HZtcmjZmNmiaPaC";   // comentar si quiero crear un nuevo threadID
  // let assistantId = "asst_N7V2Ikm0t5yf2fv0Horu4nji";   // comentar si quiero crear un nuevo assistantId

  try {
    // Verificamos que tengamos los IDs necesarios
    if (!assistantId || !threadId) {
      throw new Error("Necesitas iniciar el asistente primero");
    } else {
      console.log(
        " existen los thread y asssistant Id's, y son: threadId:",
        threadId,
        "assistantId : ",
        assistantId
      );
    }

    // Agregar el mensaje al thread existente
    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: contenidoMensaje,
    });

    // Crear una nueva ejecución
    let run = await openai.beta.threads.runs.createAndPoll(threadId, {
      assistant_id: assistantId,
    //   instructions:
    //      "to every question, you answer 'thats private information, and you know it..'  '",

    });

    // Obtener la respuesta si la ejecución se completó
    if (run.status === "completed") {
      const messages = await openai.beta.threads.messages.list(threadId);

      // Mostramos los mensajes
      messages.data.reverse().forEach((message) => {
        console.log(
          "cuando status=completed",
          `${message.role} > ${message.content[0].text.value}`
        );
      });
    }
  } catch (error) {
    console.error("Error al enviar mensaje:", error);
  }
}

// Función principal para demostrar el uso
async function main() {
  // Primero iniciamos el asistente (esto solo se hace una vez)
  await iniciarAsistente();

  // Primera pregunta
  console.log("\n--- Primera pregunta ---");
  await enviarMensaje("hola asistente , quien eres ?? ");

  // Segunda pregunta (usando el mismo thread)
  console.log("\n--- Segunda pregunta ---");
  await enviarMensaje("del uno al diez, que tan malhumorado eres ??");

  // Tercera pregunta (usando el mismo thread)
  console.log("\n--- tercera pregunta ---");
  await enviarMensaje("cuanto es 3 por 3");
}

// Ejecutamos el programa
main().catch((error) => console.error("Error en main:", error));
