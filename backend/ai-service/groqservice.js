import Groq from "groq-sdk";
import dotenv from "dotenv";
import { prompts } from "./prompt.js";
import { extractJsonFromModel } from "./extractJsonFromModel.js";
dotenv.config();
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});
/**
 * Generates a personalized internship application email.
 * Always returns { subject, body } even if the model output is malformed.
 */
export async function generateInternshipEmail(contactData) {
  try {
    const prompt = `
${prompts}
${JSON.stringify(contactData, null, 2)}

Make sure you are only Returning  a valid JSON like this nothinig else text just a json:
{
  "subject": "Your email subject",
  "body": "Your email body text"
}
`;



    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert cold-email copywriter. Always output strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 400,
    });
    // console.log("🧠 Full Groq API response:", JSON.stringify(response, null, 2));


    // Extract the text from model output
    const text =   
      response?.choices?.[0]?.message?.content?.trim() ||
       response?.choices?.[0]?.message?.reasoning?.trim();
    if (!text) throw new Error("Model returned empty content");

    let parsed = extractJsonFromModel(text);

    // // Try to safely extract JSON
    // try {
    //   // Sometimes model adds notes — so extract only the JSON part
    //   const jsonMatch = text.match(/\{[\s\S]*\}/);
    //   parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(text);
    // } catch (err) {
    //   console.warn("⚠️ Model returned non-JSON text, using fallback parser:", text);
    //   // Fallback parser if AI sends plain text like "Subject: ..., Body: ..."
    //   const subjectMatch = text.match(/Subject:\s*(.*)/i);
    //   const bodyMatch = text.match(/Body:\s*([\s\S]*)/i);
    //   parsed = {
    //     subject: subjectMatch ? subjectMatch[1].trim() : null,
    //     body: bodyMatch ? bodyMatch[1].trim() : null,
    //   };
    // }

    // Cleanup and defaults
    const cleanText = (str) =>
      str
        ? str.replaceAll("\\n", "\n").replaceAll("\n\n", "\n").replaceAll("\\t", "\t").trim()
        : "";

    const subject =
      parsed.subject?.trim() || `Interested in Contributing ${contactData.companyName} as a Full Stack & AI Engineer`;
    const body =
      // cleanText(parsed.body) 
      parsed.body
      ||
     `I've been following ${contactData.companyName}'s work and appreciate the way your team is building practical solutions that create real value for users.`
   console.log(body)
    return { subject, body };
  } catch (err) {
    console.error("❌ Error generating internship email:", err);

    // Safe fallback (never break your app)
    return {
      subject: `Interested in Contributing ${contactData.companyName} as a Full Stack & AI Engineer`,
      body:
      `I've been following ${contactData.companyName}'s work and appreciate the way your team is building practical solutions that create real value for users.`,
    };
  }
}
