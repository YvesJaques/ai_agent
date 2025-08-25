import { FunctionDeclarationsTool, SchemaType } from "@google/generative-ai";

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

// 3. A map to easily find and execute the correct function
export const availableTools: { [key: string]: Function } = {
    getProductDetails: (args: { productId: string }) => getProductDetails(args.productId),
};