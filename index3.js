import dotenv from "dotenv";
dotenv.config();
const openai = new OpenAI();
import OpenAI from "openai";


//================================================================================//
// =======================       Create an assistant       =======================//
//================================================================================//

let sebasAssistant;

async function createAssitant() {
const sebasAssistant = await openai.beta.assistants.create({
  name: "Math Tutor",
  instructions: "You are a personal math tutor. Write and run code to answer math questions.",
  tools: [{ type: "code_interpreter" }],
  model: "gpt-4o"
});
console.log("sebasAssistant es : ",sebasAssistant);
}

createAssitant();

//================================================================================//
// ======================         Create a thread        =========================//
//================================================================================//

const thread = await openai.beta.threads.create();

//================================================================================//
// =================       Add a message to the thread        ====================//
//================================================================================//

const message = await openai.beta.threads.messages.create(
    thread.id,
    {
      role: "user",
      content: "I need to solve the equation `3x + 11 = 14`. Can you help me?"
    }
    );

//================================================================================//
// ========================         Create a run          ========================//
//================================================================================//

    let run = await openai.beta.threads.runs.createAndPoll(
        thread.id,
        { 
          sebasAssistant_id: sebasAssistant.id,
          instructions: "Please address the user as Jane Doe. The user has a premium account."
        }
        );

   
//=========================================================================================//
// Once the Run completes, you can list the Messages added to the Thread by the Assistant  //
//=========================================================================================//

    if (run.status === 'completed') {
        const messages = await openai.beta.threads.messages.list(
          run.thread_id
        );
        for (const message of messages.data.reverse()) {
          console.log(`${message.role} > ${message.content[0].text.value}`);
        }
        } else {
        console.log(run.status);
        }