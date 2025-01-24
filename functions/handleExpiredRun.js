// import OpenAI from "openai";

async function handleExpiredRun(client, threadId, assistantId, maxRetries = 3) {
  let attempts = 0;

  while (attempts < maxRetries) {
    try {
      console.log(`Intento ${attempts + 1} de crear nuevo run...`);

      // Crear nuevo run
      const newRun = await client.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
      });
      console.log(`Nuevo run creado con id: ${newRun.id}`);

      // Verificar status inmediatamente
      let runStatus = await client.beta.threads.runs.retrieve(
        threadId,
        newRun.id
      );
      console.log(`Status inicial del nuevo run: ${runStatus.status}`);

      // Si no está expirado ni fallido, retornar
      if (runStatus.status !== "expired" && runStatus.status !== "failed") {
        return {
          runId: newRun.id,
          status: runStatus.status,
        };
      }

      attempts++;
      console.log(`Run ${newRun.id} no válido, intentando de nuevo...`);
    } catch (error) {
      attempts++;
      console.error(`Error en intento ${attempts}:`, error);

      if (attempts >= maxRetries) {
        throw new Error("Max retry attempts reached for creating new run");
      }
    }
  }

  throw new Error("Failed to create a valid run after multiple attempts");
}

export { handleExpiredRun };
