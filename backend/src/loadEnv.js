import dotenv from "dotenv";

dotenv.config();

console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_KEY ? "OK" : "MISSING");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID ? "OK" : "MISSING");
console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "OK" : "MISSING");
console.log("GOOGLE_REDIRECT_URI:", process.env.GOOGLE_REDIRECT_URI || "MISSING");
console.log("GOOGLE_REFRESH_TOKEN:", process.env.GOOGLE_REFRESH_TOKEN ? "OK" : "MISSING");
console.log("ADMIN_EMAIL:", process.env.ADMIN_EMAIL ? "OK" : "MISSING (login da admin ficará bloqueado)");
console.log("FRONTEND_URL:", process.env.FRONTEND_URL || "http://localhost:5173 (padrão)");

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET ausente ou curto demais (use pelo menos 32 caracteres aleatórios)");
}
