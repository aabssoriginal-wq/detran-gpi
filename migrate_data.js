const fs = require('fs');
const path = require('path');

const rawData = `Wrike- Amanda					Amanda Guedes Gomes
Hiperautomação pendências 1o contrato					Lucas Rodrigues Jose Cesario
ETP e TR - Service Desk			99	Contratação de um Service Desk para atendimento de suporte aos usuários de TI do DETRAN-SP.	Lucas Rodrigues Jose Cesario
ETP e TR - Especialistas de TI	16/03/2026		80		Daniel André Janzen
Databricks - Gestão de Pessoas	04/02/2026			Estudo de viabilidade e implementação de controles de acesso identitário, conectividade Databricks & CyberArk para rastreabilidade e segmentação de acesso.	Édipo do Nascimento Reis
eCartas	03/12/2025	30/04/2026		Automatizar o envio de notificações de trânsito via Correios em fluxo digital, com acompanhamento de status e cumprimento de prazos legais no sistema SIM.	Gustavo De Camargo Costa
Detran Concierge	01/12/2026			Plataforma omnichannel com comunicação ativa e acesso personalizado aos serviços do Detran para o cidadão.	Lucas Rodrigues Jose Cesario
Migração Mainframe					Édipo do Nascimento Reis
Projetos Google	11/10/2025	05/04/2026		Desenvolvimento de Prova Prática (digitalização de exames), Normas (gestão de regras) e SEV (automação de vistorias).	Amanda Guedes Gomes
Projetos Hiperautomação	15/10/2025	08/04/2026			Amanda Guedes Gomes
Pilares de Contratação					Amanda Guedes Gomes
Organização na Wiki dos Apps	16/01/2026	18/01/2026	99	Criação de página Wiki para centralização dos aplicativos ativos do Detran-SP, facilitando a consulta e disseminação do conhecimento.	Maila Fernandes Chagas
CNH Paulista	12/12/2025	04/10/2025	49	Adequação dos sistemas do programa CNH Paulista às novas diretrizes estabelecidas pela Resolução CONTRAN nº 1.020/2025.	Ricardo Mores Zafra Junior
SIAUT				Sistema Integrated de Autuações de Trânsito para operacionalizar lavratura de autuações e penalidades, modernizando e automatizando processos para segurança viária.	Simone Pereira dos Santos Fogaça
Sala Segura	11/03/2026	16/03/2026	100	Implantação do novo Data Center do Detran-SP.	Clayton Rodrigues do Carmo
N33	13/03/2025	30/04/2025	90	Adequação de sistemas para permitir a realização de exames práticos em municípios diversos da residência, conforme a Portaria nº 33/2024.	Rafael Ribeiro da Silva
Databricks - Exames	11/01/2025	06/01/2026		Previsão de exames práticos, visando obter o número médio previsto de exames por local nas próximas 4 semanas.	Leonardo José Ramos Botelho
Databricks - Live	23/09/2025	19/03/2026		Ingestão dos dados da LIVE /SN via conector nativo no ambiente Databricks.	Leonardo José Ramos Botelho
Databricks - TDV	31/07/2025			Ingestão dos dados da TDV via conector nativo no ambiente Databricks.	Leonardo José Ramos Botelho
Sistema AEDJ	17/03/2026	12/01/2026	10	Plataforma integrada ao STJ/SEI para automatizar tratamento de processos judiciais via IA, incluindo jurimetria e dashboards para gestão estratégica.	Amanda Guedes Gomes
b-Cadastros Legados				Integração do e-CNH com API b-Cadastro para validação de CPF/CNPJ junto à Receita Federal, garantindo integridade e rastreabilidade.	Ricardo Mores Zafra Junior
Sincronismo CEP Legados					Ricardo Mores Zafra Junior
CNPJ Alfanumérico Legados					Ricardo Mores Zafra Junior
Tenant Microsoft					Édipo do Nascimento Reis
Talonário Eletrônico	2014/2015			Atualização do Auto de Infração e Termo de Recolhimento de Veículo para formato eletrônico.	Claudio Xavier Matos
Megalake 2.0				Ingestão de dados do SIM, eVistoria, eCNH, eCRV, SISPL, SISFIN e ServiceNow no Databricks (aproximadamente 50 projetos).	Claudio Xavier Matos
Infosiga 4.0					Claudio Xavier Matos
Arquitetura de TIC					Édipo do Nascimento Reis
ITSM					Carlos Alberto Rocha
ITAM					Alex Felipe da Silva
Heimdall					Édipo do Nascimento Reis
IA - Gemini/Kiro	23/02/2026	16/04/2026	85	Aquisição de licenças Gemini e Kiro para suporte ao desenvolvimento em Power Apps e exploração de capacidades de LLM.	Bruno Zaia Boneto
Dashboard Usuários Sistemas					Bruno Zaia Boneto
Painel BR25	25/02/2026				Laisa Cristina Capodifoglio
Contratação de Tablets	12/01/2026				Daniel André Janzen
Estudo Telefonia	02/03/2026			Entrega de celulares corporativos e desativação de telefones fixos para padronização da comunicação institucional via WhatsApp.	Édipo do Nascimento Reis
Estudo plenária	09/03/2026		20	Melhoria de áudio e vídeo para a sala da plenária e demais salas de reunião (Pilar de Modernização).	Clayton Rodrigues do Carmo
Unificação contratos periféricos					Daniel André Janzen
Estudo modernização salas de reunião	03/09/2026		20	Pilar de modernização das salas de reunião, avaliando a unificação com o estudo da plenária.	Clayton Rodrigues do Carmo
Detran Pay/SEV segurança					Marcela Ramos Alexandre
CFTV					Clayton Rodrigues do Carmo
Novo Contrato do Correios					Daniel André Janzen
Novos Pilares de Contratação (SLAs)					Bruno Zaia Boneto
Novo Contrato Multicloud	01/11/2025		85		Daniel André Janzen
Estudo de Viabilidade - CyberArk Cloud					Daniel André Janzen
Política de Segurança da Informação	02/02/2026	30/04/2026	51	Elaboração, implementação e monitoramento das políticas corporativas aplicáveis a todas as unidades organizacionais.	Daniel André Janzen
ITSM - Uso por todo DETRAN	02/01/2026			Implementação de ITSM único para uso de todo o Detran e áreas de atendimento Prodesp.	Carlos Alberto Rocha
ETP e TR Licitação de Pessoal bodyshop					Daniel André Janzen
Projeto Exames Teóricos - online				Contratação de sistema 100% digital e remoto para exames teóricos, visando escalabilidade, segurança e redução de filas presenciais.	Claudio Xavier Matos
Dashboard de Exames Práticos	12/01/2025	01/01/2026		Dashboard para análise, insights e suporte à decisões estratégicas sobre exames práticos da CNH.	Leonardo José Ramos Botelho
Término da Instalação Wi-Fi	02/01/2026	27/03/2026	99	Modernização da conexão sem fio nas Superintendências e unidades Poupatempo.	Clayton Rodrigues do Carmo
BlackSpirit	14/04/2026			Orquestração de exames e fiscalização via Databricks, integrando CFTV e análise geoespacial para monitoramento em tempo real.	Bruno Zaia Boneto
Google - RST	26/01/2026	19/06/2026		App digital para registro de sinistros, com fotos, vídeos, OCR de placas e funcionamento offline, otimizando o processo de ocorrências.	Leandro Almeida Batista da Silva
Projetos Google - CGIS					Leandro Almeida Batista da Silva
Projeto Cursos					Bruno Zaia Boneto
HAVI	03/02/2026			Infraestrutura tecnológica para monitoramento e colaboração, utilizando Dockstations para organização do ambiente.	Bruno Zaia Boneto
Alteração dos Racks	02/03/2026		10	Substituição completa dos racks de comunicação localizados nas alas BV e JB do 11º andar.	Clayton Rodrigues do Carmo
Scanner Corporativo	27/03/2026		20	Alteração do método de escaneamento para possibilitar o envio direto por e-mail.	Clayton Rodrigues do Carmo
Revisão do PDTIC					Carlos Alberto Rocha
Políticas DTI			99		Carlos Alberto Rocha
Macroprocessos DTI			99		Carlos Alberto Rocha
Pendência de pagamentos PRODESP					Lucas Rodrigues Jose Cesario
AVA Moodle	03/02/2026	30/03/2026	99	Migração do AVA Moodle para a nuvem do DETRAN para ampliar o controle e a governança da infraestrutura.	Lucas Rodrigues Jose Cesario
SOC Estadual	17/03/2026	30/04/2026		Estrutura de monitoramento 24x7 centralizada para detecção e mitigação de ameaças cibernéticas em tempo real.	Édipo do Nascimento Reis
Minha Área/PLATAFORMA.SP	25/11/2025			Centralização do acesso aos sistemas corporativos com autenticação integrada e gestão unificada de credenciais.	Eduardo Fontolan Damasceno
Inventário de Dados Pessoais	14/01/2025			Mapeamento estruturado do ciclo de vida dos dados em todas as diretorias para garantir conformidade com a LGPD.	Édipo do Nascimento Reis
Encurtador de Links	17/03/2026			Solução própria de encurtamento de links para centralizar a gestão de ativos digitais com resiliência em nuvem.	Yago Taigo de Abreu Lima
BR26 - SI	01/04/2026				Yago Taigo de Abreu Lima
Hiperautomação					Amanda Guedes Gomes
Indicadores da DTI BR26 - operacional					Édipo do Nascimento Reis
Indicadores da DTI BR26 - racional					Carlos Alberto Rocha
Minha Área/Controle de Acessos Estadual					Eduardo Fontolan Damasceno
Normas				Framework centralizado para gerenciar governança normativa de SP (leis, decretos, CONTRAN/SENATRAN) com suporte de IA.	Anderson dos Santos Soares
Nova contratação CyberArk					Édipo do Nascimento Reis
Novo Talonário					Claudio Xavier Matos
Portal Credenciados					Leandro Almeida Batista da Silva
Projetos Google - Mandiant					Eduardo Fontolan Damasceno
Prova Prática					Leandro Almeida Batista da Silva
Segurança Orgânica					Eduardo Fontolan Damasceno
SEV					Marcela Ramos Alexandre
Wallet					Claudio Xavier Matos
Licitação Service Desk					Daniel André Janzen
Megalake 2.0 (Arquitetura de Dados)					Claudio Xavier Matos
Microsoft Nova Contratação					Claudio Xavier Matos
Cybersegurança - novo contrato					Claudio Xavier Matos
Monitores Curvos (adesão)					Claudio Xavier Matos
e-CPF					Claudio Xavier Matos
Sistema Biométrico					Claudio Xavier Matos
Indicadores CiberSegurança (Nist e DID)					Eduardo Fontolan Damasceno`;

const parseDate = (d) => {
  if (!d || d.trim() === "" || d.includes('/2014')) return "";
  const parts = d.split('/');
  if (parts.length !== 3) return "";
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

const lines = rawData.split('\n');
const projects = lines.map((line, index) => {
  const cols = line.split('\t');
  const nome = cols[0].trim();
  const dataInicio = parseDate(cols[1]);
  const dataFim = parseDate(cols[2]);
  const progress = parseInt(cols[3]) || 0;
  const escopo = cols[4]?.trim() || "";
  const responsavel = cols[5]?.trim() || "Não Definido";

  let status = "planejamento";
  if (progress === 100) status = "concluido";
  else if (progress > 0) status = "desenvolvimento";

  const statusMap = {
    ideacao:      { text: "Ideação",       indicator: "bg-blue-400",    icon: "FolderKanban", iconColor: "text-blue-400"    },
    planejamento: { text: "Planejamento",  indicator: "bg-indigo-400",  icon: "Clock",        iconColor: "text-indigo-400"  },
    desenvolvimento: { text: "Desenvolvimento", indicator: "bg-amber-500", icon: "Clock",        iconColor: "text-amber-500"   },
    concluido:    { text: "Concluído",     indicator: "bg-emerald-600", icon: "CheckCircle2", iconColor: "text-emerald-600" },
  };

  const meta = statusMap[status] || statusMap["planejamento"];

  return {
    id: index + 10, // Iniciando IDs de teste
    nome,
    status,
    andamento: true,
    progress,
    delta: 0,
    text: meta.text,
    indicator: meta.indicator,
    icon: meta.icon,
    iconColor: meta.iconColor,
    responsavel,
    departamento: "Diretoria de Tecnologia da Informação",
    excluido: false,
    logs: [
      {
        acao: "Carga Inicial de Massa de Dados",
        data: "28/04/2026 15:35",
        justificativa: "Migração solicitada pelo usuário",
        user: "Sistema"
      }
    ],
    baselineData: { inicio: dataInicio, fim: dataFim },
    tarefas: [],
    escopo: escopo
  };
});

fs.writeFileSync(path.join(process.cwd(), 'data.json'), JSON.stringify(projects, null, 2));
console.log(`Carga concluída: ${projects.length} projetos inseridos.`);
