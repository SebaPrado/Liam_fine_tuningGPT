const API_URL = "https://seba-whatsapp-agent.vercel.app/script_chat";

async function test() {
  const body = {
    messages: "hola, como te llamas? contame algo de seba en Australia",
    assistantId: "asst_FWYpAe5YTsAi2cz8IGoKXEI9"
  };

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // "Authorization": `Bearer tu_apiKey` // opcional si tu backend lo necesita
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Respuesta del backend:", data);
  } catch (err) {
    console.error("Error al llamar al backend:", err);
  }
}

test();