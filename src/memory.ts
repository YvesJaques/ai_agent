import { ChromaClient, Collection } from "chromadb";
import path from "path";

// Inicializa o cliente do ChromaDB.
const client = new ChromaClient();
const COLLECTION_NAME = "agent-memory";

/**
 * Obtém ou cria a coleção de memória do agente.
 * Uma coleção é como uma "tabela" em um banco de dados tradicional.
 */
export async function getMemoryCollection(): Promise<Collection> {
    try {
        return await client.getOrCreateCollection({ name: COLLECTION_NAME });
    } catch (error) {
        console.error("Failed to get or create ChromaDB collection:", error);
        throw error;
    }
}

/**
 * Adiciona uma lista de documentos à memória.
 * @param collection A instância da coleção do ChromaDB.
 * @param documents Um array de strings, onde cada string é um pedaço de conhecimento.
 */
export async function addDocumentsToMemory(collection: Collection, documents: string[]): Promise<void> {
    if (documents.length === 0) return;

    // Gera IDs únicos para cada documento
    const ids = documents.map((_, index) => `doc-${Date.now()}-${index}`);

    await collection.add({
        ids: ids,
        documents: documents,
    });
}

/**
 * Busca na memória por informações relevantes a uma query.
 * @param collection A instância da coleção do ChromaDB.
 * @param queryText O texto da busca.
 * @param nResults O número de resultados a serem retornados.
 * @returns Um array de documentos relevantes ou null se nada for encontrado.
 */
export async function queryMemory(collection: Collection, queryText: string, nResults: number = 3): Promise<(string | null)[] | null> {
    const results = await collection.query({
        queryTexts: [queryText],
        nResults: nResults,
    });

    if (!results.documents?.[0] || results.documents[0].length === 0) return null;
    return results.documents[0];
}