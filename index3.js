import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();
const openai = new OpenAI();

// Guardamos los IDs como variables globales para este ejemplo
let assistantId;
let threadId;

// Función inicial para crear el asistente y el thread
async function iniciarAsistente() {
    // Crear el asistente (solo necesitas hacerlo una vez)
    const sebasAssistant = await openai.beta.assistants.create({
        name: "Math Tutor",
        instructions: "You are a personal math tutor. Write and run code to answer math questions.",
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
}

// Función para enviar un nuevo mensaje usando los IDs guardados
async function enviarMensaje(contenidoMensaje) {
    try {
        // Verificamos que tengamos los IDs necesarios
        if (!assistantId || !threadId) {
            throw new Error("Necesitas iniciar el asistente primero");
        }

        // Agregar el mensaje al thread existente
        await openai.beta.threads.messages.create(threadId, {
            role: "user",
            content: contenidoMensaje
        });

        // Crear una nueva ejecución
        let run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
            instructions: "Please address the user as Elmatias.."
        });

        // Obtener la respuesta si la ejecución se completó
        if (run.status === "completed") {
            const messages = await openai.beta.threads.messages.list(threadId);
            
            // Mostramos los mensajes
            messages.data.reverse().forEach(message => {
                console.log(`${message.role} > ${message.content[0].text.value}`);
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
    await enviarMensaje("cuanto es x , si la ecuacion es 2x + 10 = 20 ?");

    // Segunda pregunta (usando el mismo thread)
    console.log("\n--- Segunda pregunta ---");
    await enviarMensaje("y si ahora la ecuación fuera 3x + 15 = 30?");
}

// Ejecutamos el programa
main().catch(error => console.error("Error en main:", error));
