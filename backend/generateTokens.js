// generateTokens.js — gera tokens de teste (apenas desenvolvimento)
import "./src/loadEnv.js"; // garante que o .env seja carregado
import jwt from "jsonwebtoken";

const secret = process.env.JWT_SECRET;

// Token de cliente (use o id real de um cliente da tabela "clientes")
const clientPayload = { id: process.argv[2] || "<uuid-do-cliente>", telefone: "5514999999999", role: "client" };
const clientToken = jwt.sign(clientPayload, secret, { expiresIn: "1d" });

const adminToken = jwt.sign({ role: "admin", email: process.env.ADMIN_EMAIL }, secret, { expiresIn: "1d" });

console.log("CLIENT TOKEN:\n", clientToken);
console.log("\nADMIN TOKEN:\n", adminToken);
