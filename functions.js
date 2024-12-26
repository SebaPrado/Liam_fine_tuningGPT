const { OpenAI } = require("openai");
const axios = require("axios");
const fs = require("fs").promises;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
// const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
// const assistant_instructions = "Tus instrucciones para el asistente aquí";

// ======= 1) Función para crear o cargar el asistente en Open AI  ==== //

async function create_assistant(client) {
  const assistant_file_path = "assistant.json";

  try {
    // PASO 1: Intenta cargar un asistente existente
    try {
      const assistantData = await fs.readFile(assistant_file_path, "utf8");
      const { assistant_id } = JSON.parse(assistantData);
      console.log("Loaded existing assistant ID.");
      return assistant_id;
    } catch (error) {
      // PASO 2: Crea un nuevo asistente con tu modelo fine-tuned
      const assistant = await client.beta.assistants.create({
        model: "ft:gpt-3.5-turbo-0125:seba-y-daro-org:hotelmodelseba:AhwE3v3M",
        tools: [
          {
            type: "function",
            function: {
              name: "create_lead",
              description: "Capture lead details and save to Airtable.",
              parameters: {
                type: "object",
                properties: {
                  name: {
                    type: "string",
                    description: "Full name of the lead.",
                  },
                  phone: {
                    type: "string",
                    description:
                      "Phone number of the lead including country code.",
                  },
                },
                required: ["name", "phone"],
              },
            },
          },
        ],
        // Ya no necesitamos file_ids
      });

      // Guarda el ID del asistente
      await fs.writeFile(
        assistant_file_path,
        JSON.stringify({ assistant_id: assistant.id })
      );

      console.log("Created a new assistant with fine-tuned model");
      return assistant.id;
    }
  } catch (error) {
    console.error("Error creating/loading assistant:", error);
    throw error;
  }
}

// ==========   2 )   Función para crear un lead en Airtable     =============//

// async function create_lead(name, phone) {
//   const url =
//     "https://api.airtable.com/v0/appM1yx0NobvowCAg/Accelerator%20Leads";
//   const headers = {
//     Authorization: AIRTABLE_API_KEY, // NOTA: El AIRTABLE_API_KEY debe incluir "Bearer TUKEY"
//     "Content-Type": "application/json",
//   };

//   const data = {
//     records: [
//       {
//         fields: {
//           Name: name,
//           Phone: phone,
//         },
//       },
//     ],
//   };

//   try {
//     const response = await axios.post(url, data, { headers });
//     console.log("Lead created successfully.");
//     return response.data;
//   } catch (error) {
//     console.error(`Failed to create lead: ${error.message}`);
//     throw error;
//   }
// }

module.exports = {
  //   create_lead,
  create_assistant,
};