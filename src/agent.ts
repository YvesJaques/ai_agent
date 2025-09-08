import { GoogleGenerativeAI, ChatSession, GenerativeModel, Part, FunctionCall } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { allTools, availableTools } from "./tools";

dotenv.config({ quiet: true });

function configureAgent(): GenerativeModel | null {

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("API key not found.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log("Agent successfully configured!");

        return genAI.getGenerativeModel({
            model: "gemini-1.5-flash-latest",
            tools: allTools,
        });

    } catch (error) {
        console.error("Configuration error:", error instanceof Error ? error.message : error);
        return null;
    }
}

async function startChat(model: GenerativeModel) {
    console.log("\n--- AI Agent (Node.js/TS) Started ---");
    console.log("Type 'exit' to quit.");

    const rl = readline.createInterface({ input, output });

    const systemInstruction = `
        You are Nexus, a versatile and proactive general-purpose AI assistant. Your primary goal is to understand user requests, break them down into logical steps, and use your available tools to accomplish the task efficiently.

        Your core principles are:
        1.  **Think Step-by-Step:** Before acting, briefly outline your plan. For example, "Okay, to answer that, I will first search my memory for 'Project BlueFox', and then I will look up the details for any product IDs I find."
        2.  **Tool-First Mentality:** Always consider if a tool can help before answering from your general knowledge. Your tools are your primary strength.
        3.  **Ask for Clarification:** If a user's request is vague or ambiguous, ask for more details to ensure you are solving the right problem. For example, "When you say 'report', what specific information are you looking for?"
        4.  **Be Transparent:** Announce which tool you are about to use (e.g., "[Using searchMemory tool...]").
        5.  **Acknowledge Limitations:** If you cannot fulfill a request because a tool is missing or the information is unavailable, state it clearly.
    `;

    const chat: ChatSession = model.startChat({
        tools: allTools,
        history: [
            {
                role: "user",
                parts: [{ text: systemInstruction }],
            },
            {
                role: "model",
                parts: [{ text: "Understood. I am Nexus, ready to assist by thinking step-by-step and utilizing my tools." }],
            },
        ],
    });

    while (true) {
        const userPrompt = await rl.question("\nYou: ");

        if (userPrompt.toLowerCase() === 'exit') {
            console.log("Good bye!");
            rl.close();
            break;
        }

        let messageToSend: string | Part[] = userPrompt;
        let keepTurning = true;

        try {
            while (keepTurning) {
                const result = await chat.sendMessage(messageToSend);
                const response = result.response;
                const calls: FunctionCall[] | undefined = response.functionCalls();

                if (calls && calls.length > 0) {
                    console.log("[Agente] Modelo solicitou o uso de uma ferramenta...");

                    const functionResponses: Part[] = await Promise.all(
                        calls.map(async (call) => {
                            const functionToCall = availableTools[call.name];
                            if (!functionToCall) {
                                throw new Error(`Função desconhecida: ${call.name}`);
                            }
                            const functionResult = await functionToCall(call.args);
                            return {
                                functionResponse: {
                                    name: call.name,
                                    response: functionResult
                                },
                            };
                        }));

                    messageToSend = functionResponses;
                } else {
                    console.log("Gemini:", response.text());
                    keepTurning = false;
                }
            }
        } catch (error) {
            console.error("\nAn error occurred:", error);
        }
    }
}

async function main() {
    const model = configureAgent();
    if (model) {
        await startChat(model);
    }
}

main();