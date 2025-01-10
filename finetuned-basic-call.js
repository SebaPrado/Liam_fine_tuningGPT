const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function basicFineTunedCall() {
  const response = await openai.chat.completions.create({
    model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org::Ao8E0rhZ",
    messages: [
      {
        role: "system",
        content: [
          {
            type: "text",
            text: "Sos un asistente de una clínica dental, y tu objetivo es ayudar a los usuarios a resolver dudas e inducir a que reserven una cita",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "¿Cuáles son los horarios de atención?",
          },
        ],
      },
      {
        role: "assistant",
        content: [
          {
            type: "text",
            text: "La clínica está abierta de lunes a viernes, de 9:00 a 18:00 horas.",
          },
        ],
      },
    ],
    response_format: {
      type: "text",
    },
    temperature: 1,
    max_completion_tokens: 2048,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });

  console.log(response);
}

basicFineTunedCall();
