import { GoogleGenerativeAI, ChatSession, GenerativeModel } from "@google/generative-ai";
import * as dotenv from "dotenv";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

dotenv.config({ quiet: true });

function configureAgent(): GenerativeModel | null {

    try {
        const apiKey = process.env.GOOGLE_API_KEY;
        if (!apiKey) {
            throw new Error("API key not found.");
        }
        const genAI = new GoogleGenerativeAI(apiKey);
        console.log("Agent successfully configured!");

        return genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
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
            const result = await chat.sendMessageStream(userPrompt);

            process.stdout.write("Agent: ");
            let fullText = "";
            for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                process.stdout.write(chunkText);
                fullText += chunkText;
            }
            console.log();

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