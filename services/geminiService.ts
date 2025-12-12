import { GoogleGenAI } from "@google/genai";
import { UploadedFile } from "../types";

const processFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve) => {
    // Only process text-based files for analysis to save tokens/complexity
    if (file.type.startsWith('text/') || 
        file.name.endsWith('.js') || 
        file.name.endsWith('.ts') || 
        file.name.endsWith('.tsx') || 
        file.name.endsWith('.json') ||
        file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string || "");
      reader.readAsText(file);
    } else {
      resolve(`[Skipped binary/non-text file: ${file.name}]`);
    }
  });
};

export const analyzeFilesWithGemini = async (files: UploadedFile[]): Promise<string> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Limit to first 10 files or 50KB to avoid context limits in this demo
  const fileSummaries: string[] = [];
  
  // Simple heuristic: Take first 15 relevant files
  const textFiles = files.filter(f => 
    f.file.type.startsWith('text') || 
    f.path.match(/\.(js|ts|tsx|json|md|html|css|py|java)$/i)
  ).slice(0, 15);

  if (textFiles.length === 0) {
    return "No text or code files found to analyze.";
  }

  for (const f of textFiles) {
    const content = await processFileContent(f.file);
    // Truncate large files
    const truncatedContent = content.length > 2000 ? content.substring(0, 2000) + "...(truncated)" : content;
    fileSummaries.push(`File: ${f.path}\nContent:\n${truncatedContent}\n---`);
  }

  const prompt = `
    You are an expert software engineer and data analyst.
    I have uploaded a set of files from a folder. 
    Please provide a structured summary of this project/folder.
    
    Include:
    1. A brief description of what this project seems to be.
    2. Key technologies or data formats detected.
    3. A list of the most interesting files and why.
    4. Suggestions for improvements if it's code.

    Here are the file contents:
    ${fileSummaries.join('\n')}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: { thinkingBudget: 0 } 
      }
    });
    return response.text || "No analysis generated.";
  } catch (error: any) {
    console.error("Gemini Error", error);
    throw new Error(`Gemini Analysis Failed: ${error.message}`);
  }
};