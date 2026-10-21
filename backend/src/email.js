import { gmail, loadStoredRefreshToken } from "./googleCalendar.js"

// Cabeçalho com acentos precisa ser codificado (RFC 2047)
function cabecalhoUtf8(texto) {
  return `=?UTF-8?B?${Buffer.from(texto, "utf8").toString("base64")}?=`
}

/**
 * Envia um e-mail pela conta Gmail da proprietária (mesma autorização da agenda;
 * exige o escopo gmail.send, concedido no login da admin).
 */
export async function enviarEmail({ para, assunto, texto, html }) {
  const remetente = (process.env.ADMIN_EMAIL || "").trim()
  const limite = `limite-${Date.now().toString(36)}`

  const mensagem = [
    `From: ${cabecalhoUtf8("Studio Dantas")} <${remetente}>`,
    `To: ${para}`,
    `Subject: ${cabecalhoUtf8(assunto)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${limite}"`,
    "",
    `--${limite}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(texto, "utf8").toString("base64"),
    `--${limite}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(html, "utf8").toString("base64"),
    `--${limite}--`,
  ].join("\r\n")

  // No Netlify cada instância lê a autorização só ao iniciar: relê do banco para
  // usar a do último login da admin (que pode ter acabado de conceder o gmail.send)
  await loadStoredRefreshToken()

  await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw: Buffer.from(mensagem, "utf8").toString("base64url") },
  })
}

export async function enviarLinkRedefinicao({ para, nome, link }) {
  const primeiroNome = String(nome || "").split(" ")[0] || "cliente"

  await enviarEmail({
    para,
    assunto: "Redefinição de senha - Studio Dantas",
    texto:
      `Olá, ${primeiroNome}!\n\n` +
      `Recebemos um pedido para redefinir a senha da sua conta no Studio Dantas.\n` +
      `Para criar uma nova senha, acesse o link abaixo (válido por 1 hora):\n\n${link}\n\n` +
      `Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #2e2630; max-width: 480px">
        <p>Olá, ${primeiroNome.replace(/[<>&"]/g, "")}!</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta no Studio Dantas.</p>
        <p>
          <a href="${link}" style="display: inline-block; padding: 12px 24px; background: #c9a227;
             color: #fff; text-decoration: none; border-radius: 999px">Criar nova senha</a>
        </p>
        <p style="font-size: 13px; color: #777">
          O link vale por 1 hora. Se você não fez esse pedido, ignore este e-mail: sua senha continua a mesma.
        </p>
      </div>`,
  })
}
