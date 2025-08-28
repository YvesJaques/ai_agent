import { getMemoryCollection, addDocumentsToMemory } from "./src/memory";

const memoryData: string[] = [
    "Project BlueFox is a top-secret initiative scheduled for Q4.",
    "The project manager for BlueFox is Dr. Evelyn Reed.",
    "Project BlueFox focuses on developing a new type of quantum-resistant encryption algorithm.",
    "The budget allocated for Project BlueFox is $5 million.",
    "Key stakeholders for BlueFox include the Department of Innovation and a security agency.",
    "Initial prototypes for BlueFox are expected by the end of October.",
];
// --------------------------------------------------------------------

async function main() {
    console.log("Accessing memory collection...");
    const memoryCollection = await getMemoryCollection();

    console.log("Populating agent's memory with new knowledge...");
    await addDocumentsToMemory(memoryCollection, memoryData);

    console.log("✅ Memory populated successfully!");
    console.log(`Added ${memoryData.length} new documents.`);
}

main().catch(console.error);