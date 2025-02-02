import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI();
import OpenAI from "openai";

//let sebasAssistant;

async function main() {
    
  //================================================================================//
  // =======================       Crear un asistente       =======================//
  //================================================================================//

//   sebasAssistant = await openai.beta.assistants.create({
//     name: "Math Tutor",
//     instructions:
//       "You are a personal math tutor. Write and run code to answer math questions.",
//     tools: [{ type: "code_interpreter" }],
//     model: "gpt-4o",
//   });
//   console.log("sebasAssistant es : ", sebasAssistant);

  //================================================================================//
  // ======================         Crear un hilo        =========================//
  //================================================================================//

  console.log(".. 1)..");
  const thread = await openai.beta.threads.create();
  console.log(".. 2)..");

  //================================================================================//
  // =================       Agregar un mensaje al hilo        ====================//
  //================================================================================//

  console.log(".. 3)..");

  const SebasNewMesagge = await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: " me podes decir donde queda la clinica ???",
  });
  console.log(" 4) message: ", SebasNewMesagge);

  //===============================================================================//
  // ====================         Crear una ejecución          ====================//
  //===============================================================================//

  console.log(".. 5)..");

  let run = await openai.beta.threads.runs.createAndPoll(thread.id, {
    assistant_id: "asst_sBmjedCg1l72PZtXnJWN7Jk0"
  });
  console.log(".. 6)..");

  //=====================================================================================================//
  // Una vez que la ejecución se completa, puedes listar los mensajes añadidos al hilo por el asistente  //
  //=====================================================================================================//

  if (run.status === "completed") {
    const messages = await openai.beta.threads.messages.list(run.thread_id);
    for (const message of messages.data.reverse()) {
      console.log("el listado de msjs para este thread es: ",`${message.role} > ${message.content[0].text.value}`);
    }
  } else {
    console.log(run.status);
  }
}

main().catch((error) => console.error("Error en la ejecución de main:", error));
