import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBgV479cgKvZotLVhV7DrWuRf4Tli14mG0");
const model = genAI.getGenerativeModel({model: "gemini-2.5-flash-lite"});

const result = await model.generateContent("What is your name?");
console.log(result.response.text());