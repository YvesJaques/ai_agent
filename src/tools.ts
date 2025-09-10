import { FunctionDeclarationsTool, SchemaType } from "@google/generative-ai";
import { getMemoryCollection, queryMemory } from "./memory";
import wiki from 'wikipedia';

// 1. The actual TypeScript function you will execute
const getProductDetails = (productId: string): { name: string, price: number, stock: number } | { error: string } => {
    console.log(`[Tool] Searching for product with ID: ${productId}`);

    // This is a mock database. In a real app, you'd query a real DB or API.
    const mockDatabase: { [key: string]: { name: string, price: number, stock: number } } = {
        "prod-123": { name: "Quantum Laptop", price: 1500.00, stock: 42 },
        "prod-456": { name: "Starlight Mouse", price: 89.99, stock: 150 },
        "prod-789": { name: "Cosmic Keyboard", price: 129.50, stock: 0 },
    };

    const product = mockDatabase[productId];

    if (product) {
        return product;
    } else {
        return { error: `Product with ID '${productId}' not found.` };
    }
};

// 2. The function declaration (schema) that Gemini will use
// This tells the model what the function is called, what it does, and what parameters it expects.
export const productTool: FunctionDeclarationsTool = {
    functionDeclarations: [
        {
            name: "getProductDetails",
            description: `
                Retrieves detailed information for a specific product from the inventory database.
                Use this function when the user asks about the price, name, or stock quantity of an item.
                The function returns a JSON object with the following fields:
                - id (string): The product's unique identifier.
                - name (string): The product's name.
                - price (number): The price of the product.
                - stock (number): The quantity of units in stock.
                If the product is not found, it returns an object with an 'error' field.
            `,
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    productId: {
                        type: SchemaType.STRING,
                        description: "The unique identifier of the product (e.g., 'prod-123').",
                    }
                },
                required: ["productId"],
            },
        },
    ],
};

/**
 * A função que o agente irá executar para buscar na memória.
 */
async function searchMemory(query: string): Promise<{ results: (string | null)[] | string }> {
    console.log(`[Tool] Searching memory for: "${query}"`);
    const memoryCollection = await getMemoryCollection();
    const results = await queryMemory(memoryCollection, query, 3);

    if (results) {
        return { results };
    } else {
        return { results: "No relevant information found in memory." };
    }
}

/**
 * O schema que descreve a ferramenta de memória para o Gemini.
 */
export const memorySearchTool: FunctionDeclarationsTool = {
    functionDeclarations: [
        {
            name: "searchMemory",
            description: `
                Searches a private knowledge base for information.
                Use this tool when the user asks about specific topics, internal projects (like 'Project BlueFox'),
                or when you need context that you don't inherently possess.
                Provide a concise search query as the parameter.
            `,
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: {
                        type: SchemaType.STRING,
                        description: "A short, specific search query to find relevant information.",
                    },
                },
                required: ["query"],
            },
        },
    ],
};

async function searchWikipedia(query: string): Promise<{ title: string, summary: string, url: string } | { error: string }> {
    console.log(`[Tool] Searching Wikipedia for: "${query}"`);
    try {
        // Busca um resumo conciso do tópico
        const summary = await wiki.summary(query);

        return {
            title: summary.title,
            summary: summary.extract, // 'extract' contém o resumo
            url: summary.content_urls.desktop.page, // URL para referência
        };
    } catch (error) {
        console.error("[Tool Error] Wikipedia search failed:", error);
        return { error: `Could not find a Wikipedia article for "${query}". Please try a different search term.` };
    }
}

/**
 * O schema que descreve a ferramenta da Wikipedia para o Gemini.
 */
export const wikipediaSearchTool: FunctionDeclarationsTool = {
    functionDeclarations: [
        {
            name: "searchWikipedia",
            description: `
                Searches for a Wikipedia article to get general knowledge and definitions about a topic.
                Use this tool to answer questions about public figures, historical events, scientific concepts, places, or companies.
                It returns a concise summary of the topic.
                Do not use it for internal project information or product inventory.
            `,
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: {
                        type: SchemaType.STRING,
                        description: "The topic or search term to look up on Wikipedia (e.g., 'Quantum Computing', 'Albert Einstein').",
                    },
                },
                required: ["query"],
            },
        },
    ],
};

export const allTools = [productTool, memorySearchTool, wikipediaSearchTool];

// 3. A map to easily find and execute the correct function
export const availableTools: { [key: string]: Function } = {
    getProductDetails: (args: { productId: string }) => getProductDetails(args.productId),
    searchMemory: (args: { query: string }) => searchMemory(args.query),
    searchWikipedia: (args: { query: string }) => searchWikipedia(args.query),
};