import nodemailer from 'nodemailer';

// Configurações via variáveis de ambiente
const smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true para 465, false para outras
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

const fromEmail = process.env.SMTP_FROM || '"GPI - Detran SP" <gpi@detran.sp.gov.br>';

// Cria o transporter apenas se as configurações básicas existirem
const createTransporter = () => {
  if (!smtpConfig.host || !smtpConfig.auth.pass) {
    console.warn('⚠️ SMTP não configurado. As notificações por e-mail estão desativadas.');
    return null;
  }
  return nodemailer.createTransport(smtpConfig);
};

const transporter = createTransporter();

/**
 * Envia um e-mail de boas-vindas para um novo usuário
 */
export async function sendWelcomeEmail(user: { nome: string; email: string; papel: string }) {
  if (!transporter) return;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
        <img src="https://www.detran.sp.gov.br/702a783633529610cd8381ac4f5c7b5b.iix" alt="Detran SP" style="height: 40px;">
        <h1 style="color: white; margin-top: 16px; font-size: 20px;">Bem-vindo ao GPI</h1>
      </div>
      <div style="padding: 32px; color: #1e293b;">
        <p>Olá, <strong>${user.nome}</strong>!</p>
        <p>Seu acesso ao <strong>GPI - Gestão de Projetos e Iniciativas</strong> foi criado com sucesso.</p>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 24px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Perfil de Acesso:</strong> ${user.papel.replace('_', ' ').toUpperCase()}</p>
          <p style="margin: 8px 0 0 0; font-size: 14px;"><strong>Link de Acesso:</strong> <a href="${process.env.NEXTAUTH_URL}" style="color: #2563eb;">${process.env.NEXTAUTH_URL}</a></p>
        </div>
        <p style="font-size: 14px; line-height: 1.6;">O acesso é realizado via Single Sign-On (SSO) utilizando suas credenciais do Microsoft Azure / Office 365 do Detran.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">Este é um e-mail automático, por favor não responda.</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: '📦 Bem-vindo ao GPI - Acesso Criado',
      html,
    });
    console.log(`✅ E-mail de boas-vindas enviado para: ${user.email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de boas-vindas:', error);
  }
}

/**
 * Envia um e-mail notificando a designação de responsabilidade em um projeto
 */
export async function sendAssignmentEmail(user: { nome: string; email: string }, project: { nome: string; id: number | string }) {
  if (!transporter) return;

  const projectUrl = `${process.env.NEXTAUTH_URL}/dashboard/projetos/${project.id}`;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
        <img src="https://www.detran.sp.gov.br/702a783633529610cd8381ac4f5c7b5b.iix" alt="Detran SP" style="height: 40px;">
        <h1 style="color: white; margin-top: 16px; font-size: 20px;">Nova Designação de Projeto</h1>
      </div>
      <div style="padding: 32px; color: #1e293b;">
        <p>Olá, <strong>${user.nome}</strong>!</p>
        <p>Você foi designado como <strong>Responsável</strong> pela seguinte iniciativa no GPI:</p>
        <div style="border-left: 4px solid #2563eb; background-color: #f0f9ff; padding: 16px; margin: 24px 0;">
          <h2 style="margin: 0; font-size: 16px; color: #1e3a8a;">${project.nome}</h2>
        </div>
        <p style="text-align: center; margin-top: 32px;">
          <a href="${projectUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 14px;">Acessar Projeto</a>
        </p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 32px 0 24px 0;">
        <p style="font-size: 12px; color: #64748b; text-align: center;">GPI - Sistema de Gestão de Projetos e Iniciativas</p>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: fromEmail,
      to: user.email,
      subject: `📌 Nova Designação: ${project.nome}`,
      html,
    });
    console.log(`✅ E-mail de designação enviado para: ${user.email}`);
  } catch (error) {
    console.error('❌ Erro ao enviar e-mail de designação:', error);
  }
}
