
import { GoogleGenAI, Type } from "@google/genai";
import { ResumeData } from "../types";

export const extractResumeData = async (rawText: string): Promise<ResumeData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Extract the following person's details into a structured JSON format suitable for a professional resume. 
    Source text: ${rawText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          personalInfo: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              phone: { type: Type.STRING },
              email: { type: Type.STRING },
              linkedin: { type: Type.STRING },
              github: { type: Type.STRING }
            },
            required: ["name", "email"]
          },
          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                school: { type: Type.STRING },
                degree: { type: Type.STRING },
                location: { type: Type.STRING },
                date: { type: Type.STRING },
                description: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["school", "degree", "date"]
            }
          },
          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                location: { type: Type.STRING },
                date: { type: Type.STRING },
                description: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["company", "role", "date"]
            }
          },
          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                tech: { type: Type.STRING },
                date: { type: Type.STRING },
                description: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["name", "date"]
            }
          },
          skills: {
            type: Type.OBJECT,
            properties: {
              languages: { type: Type.STRING },
              frameworks: { type: Type.STRING },
              tools: { type: Type.STRING },
              libraries: { type: Type.STRING }
            }
          }
        },
        required: ["personalInfo", "education", "experience", "skills"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No data returned from AI");
  
  return JSON.parse(text) as ResumeData;
};
