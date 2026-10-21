<template>
  <DocumentoLegal titulo="Termos de Uso" atualizado-em="21 de outubro de 2026">
    <p>
      Ao usar o site de agendamentos do <strong>Studio Dantas · Lash Beauty</strong>, você concorda com
      os termos abaixo. Se não concordar, entre em contato com o salão diretamente pelo
      <a :href="WHATSAPP_URL" target="_blank" rel="noopener">WhatsApp</a>.
    </p>

    <p class="destaque">
      Este sistema é um <strong>projeto acadêmico</strong> desenvolvido por estudantes da
      <strong>Universidade Virtual do Estado de São Paulo (Univesp)</strong> na disciplina
      <strong>Projeto Integrador em Computação II – DRP07, Turma 001</strong>, aplicado ao Studio
      Dantas. Os atendimentos, preços e políticas do salão são de responsabilidade do Studio Dantas.
    </p>

    <h3>1. O serviço</h3>
    <p>
      O site permite consultar os serviços do salão, ver os horários disponíveis, solicitar
      agendamentos e acompanhar os horários marcados.
    </p>

    <h3>2. Cadastro e acesso</h3>
    <ul>
      <li>O acesso é feito pelo número de celular, sem senha. Informe um número que seja seu.</li>
      <li>
        Quem souber o seu número consegue ver os seus agendamentos no site; por isso, use o sistema em
        aparelhos de confiança e clique em <em>Sair</em> ao terminar.
      </li>
      <li>Mantenha seu nome e telefone corretos, para que o salão consiga falar com você.</li>
    </ul>

    <h3>3. Agendamentos</h3>
    <ul>
      <li>
        Todo agendamento feito pelo site fica <strong>pendente</strong> até ser confirmado pelo salão.
      </li>
      <li>Os horários exibidos dependem da disponibilidade da agenda no momento da reserva.</li>
      <li>
        Para remarcar ou cancelar, fale com o salão pelo WhatsApp. O salão também pode remarcar ou
        cancelar um horário, avisando você pelo telefone informado.
      </li>
      <li>
        Os preços podem mudar sem aviso prévio; vale o valor do serviço na data em que o agendamento
        foi feito.
      </li>
    </ul>

    <h3>4. Uso adequado</h3>
    <p>
      Não é permitido fazer agendamentos falsos, usar o telefone de outra pessoa ou tentar acessar
      áreas restritas do sistema. O salão pode excluir cadastros e agendamentos que não respeitem estas
      regras.
    </p>

    <h3>5. Disponibilidade</h3>
    <p>
      Por se tratar de um projeto acadêmico hospedado em serviços gratuitos, o site pode passar por
      instabilidades ou ficar temporariamente fora do ar. Em caso de divergência, vale o que for
      combinado diretamente com o salão.
    </p>

    <h3>6. Privacidade</h3>
    <p>
      O tratamento dos seus dados está descrito na
      <router-link to="/privacidade">Política de Privacidade</router-link>.
    </p>

    <h3>7. Alterações</h3>
    <p>
      Estes termos podem ser atualizados. A data da última versão aparece no início da página.
    </p>
  </DocumentoLegal>
</template>

<script setup lang="ts">
import DocumentoLegal from '@/components/DocumentoLegal.vue'
import { WHATSAPP_URL } from '@/config/contato'
</script>
