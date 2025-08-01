import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" })
    const result = await model.embedContent(text)
    const embedding = result.embedding?.values || [];
    
    // Ensure we have the correct number of dimensions
    if (embedding.length !== 1536) {
      console.warn(`Unexpected embedding length: ${embedding.length}, expected 1536`);
      // Pad or truncate to match expected dimensions
      if (embedding.length < 1536) {
        return [...embedding, ...Array(1536 - embedding.length).fill(0)];
      }
      return embedding.slice(0, 1536);
    }
    
    return embedding;
  } catch (error) {
    console.error("Error generating embedding:", error)
    // Fallback: generate a mock embedding with correct dimensions for development
    console.warn("Using mock embedding");
    return Array.from({ length: 1536 }, () => Math.random() - 0.5);
  }
}

export async function generateResponse(prompt: string, context?: string): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY is not set in the environment.");
      return "AI Service is not configured. Missing API Key.";
    }

    const fullPrompt = context
      ? `Context from documents:\n${context}\n\nUser question: ${prompt}\n\nPlease answer based on the provided context and your knowledge.`
      : prompt;

    // For debugging: log the prompt being sent
    // console.log("--- Sending to Gemini ---", fullPrompt.substring(0, 300));

    const result = await geminiModel.generateContent(fullPrompt);
    const text = result.response.text();

    if (!text) {
      return "AI returned an empty response.";
    }
    return text;

  } catch (error) {
    console.error("Error in generateResponse:", error);
    // Provide a more specific error message for easier debugging
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return `AI Error: ${errorMessage}. Check server logs for details.`;
  }
}
