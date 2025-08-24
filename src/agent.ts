import { GoogleGenerativeAI, ChatSession, GenerativeModel, Part, FunctionCall } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { availableTools, productTool } from "./tools";

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
            tools: [productTool],
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

    const chat: ChatSession = model.startChat({
        history: []
    });

    while (true) {
        const userPrompt = await rl.question("\nYou: ");

        if (userPrompt.toLowerCase() === 'exit') {
            console.log("Good bye!");
            rl.close();
            break;
        }

        try {
            const result = await chat.sendMessage(userPrompt);
            const response = result.response;
            const calls: FunctionCall[] | undefined = response.functionCalls();

            if (calls?.length) {
                console.log("[Agente] Modelo solicitou o uso de uma ferramenta...");
                const functionResponses: Part[] = [];

                for (const call of calls) {
                    const functionToCall = availableTools[call.name];
                    if (!functionToCall) {
                        throw new Error(`Função desconhecida: ${call.name}`);
                    }

                    const functionResult = await functionToCall(call.args);

                    functionResponses.push({
                        functionResponse: {
                            name: call.name,
                            response: functionResult,
                        },
                    });
                }

                const finalResult = await chat.sendMessage(functionResponses);
                console.log("Gemini:", finalResult.response.text());

            } else {
                console.log("Gemini:", response.text());
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