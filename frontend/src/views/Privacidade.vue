<template>
  <DocumentoLegal titulo="Política de Privacidade" atualizado-em="21 de outubro de 2026">
    <p>
      Esta política explica quais dados pessoais o site de agendamentos do
      <strong>Studio Dantas · Lash Beauty</strong> coleta, para que são usados e quais são os seus
      direitos, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 – LGPD).
    </p>

    <p class="destaque">
      Este sistema foi desenvolvido por estudantes da <strong>Universidade Virtual do Estado de São Paulo
      (Univesp)</strong> como trabalho da disciplina <strong>Projeto Integrador em Computação II –
      DRP07, Turma 001</strong>, e é utilizado pelo Studio Dantas para receber e organizar seus
      agendamentos. O Studio Dantas é o responsável (controlador) pelos dados tratados.
    </p>

    <h3>1. Dados que coletamos</h3>
    <ul>
      <li>
        <strong>Clientes:</strong> nome, número de telefone e e-mail, informados no primeiro acesso, e
        a senha, guardada apenas de forma criptografada (nem o salão consegue lê-la).
      </li>
      <li>
        <strong>Agendamentos:</strong> serviço escolhido, data e horário, observações que você escrever,
        situação (pendente, confirmado ou cancelado) e valor do serviço na data da marcação.
      </li>
      <li>
        <strong>Proprietária do salão:</strong> e-mail da conta Google usada para entrar no painel
        administrativo e a autorização de acesso ao Google Agenda e ao envio de e-mails pelo Gmail.
      </li>
      <li>
        <strong>No seu navegador:</strong> guardamos apenas um código de sessão para manter você
        conectada. Não usamos cookies de rastreamento, ferramentas de análise ou publicidade.
      </li>
    </ul>

    <h3>2. Para que usamos os dados</h3>
    <ul>
      <li>Identificar você e mostrar os seus agendamentos;</li>
      <li>Enviar o link para criar uma nova senha quando você pedir em "Esqueci minha senha";</li>
      <li>Reservar o horário escolhido e evitar conflitos na agenda;</li>
      <li>Permitir que o salão confirme, remarque ou cancele o atendimento e entre em contato com você;</li>
      <li>Gerar relatórios internos do salão, como quantidade de atendimentos e faturamento.</li>
    </ul>
    <p>
      O tratamento se baseia na execução dos procedimentos necessários ao serviço que você solicitou
      (art. 7º, V, da LGPD) e no legítimo interesse do salão em organizar seus atendimentos
      (art. 7º, IX). Seus dados não são vendidos nem usados para propaganda.
    </p>

    <h3>3. Com quem os dados são compartilhados</h3>
    <p>Somente com os serviços necessários para o funcionamento do site:</p>
    <ul>
      <li><strong>Supabase</strong> – banco de dados onde ficam cadastros e agendamentos;</li>
      <li>
        <strong>Google Agenda</strong> – cada agendamento vira um evento na agenda da proprietária,
        com seu nome, telefone, serviço e observações;
      </li>
      <li><strong>Gmail</strong> – envio do e-mail de redefinição de senha, a partir da conta do salão;</li>
      <li><strong>Netlify</strong> – hospedagem do site.</li>
    </ul>

    <h3>4. Uso de dados do Google</h3>
    <p>
      O acesso ao Google é usado apenas pela proprietária do salão: o e-mail confirma que só ela entra
      no painel, e a permissão do Google Agenda serve exclusivamente para criar, atualizar e remover os
      eventos dos agendamentos. A permissão do Gmail é usada somente para enviar às clientes o e-mail
      de redefinição de senha; o site não lê nem guarda as mensagens da conta. O uso e a transferência de informações recebidas das APIs do Google
      seguem a
      <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">
        Política de Dados do Usuário dos Serviços de API do Google</a>, incluindo os requisitos de Uso
      Limitado. Essa permissão pode ser revogada a qualquer momento em
      <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener">myaccount.google.com/permissions</a>.
    </p>

    <h3>5. Por quanto tempo guardamos</h3>
    <p>
      Os dados ficam armazenados enquanto você mantiver seu cadastro ou enquanto forem necessários para
      o histórico de atendimentos do salão. Você pode pedir a exclusão a qualquer momento.
    </p>

    <h3>6. Seus direitos</h3>
    <p>
      Pela LGPD (art. 18), você pode pedir a confirmação e o acesso aos seus dados, a correção de dados
      incompletos ou errados, a exclusão do cadastro e informações sobre o compartilhamento. Para isso,
      fale com o salão pelo <a :href="WHATSAPP_URL" target="_blank" rel="noopener">WhatsApp</a>.
    </p>

    <h3>7. Segurança</h3>
    <p>
      O site usa conexão criptografada (HTTPS). O painel administrativo é restrito à conta Google da
      proprietária, e as chaves de acesso ao banco de dados ficam apenas no servidor, nunca no
      navegador.
    </p>

    <h3>8. Alterações</h3>
    <p>
      Esta política pode ser atualizada. A data da última versão aparece no início da página.
      Consulte também os <router-link to="/termos">Termos de Uso</router-link>.
    </p>
  </DocumentoLegal>
</template>

<script setup lang="ts">
import DocumentoLegal from '@/components/DocumentoLegal.vue'
import { WHATSAPP_URL } from '@/config/contato'
</script>
