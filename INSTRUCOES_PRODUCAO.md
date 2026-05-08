# Guia de Configuração - GPI Produção

Este documento contém as instruções necessárias para o deploy do sistema GPI em ambiente de produção.

## 1. Variáveis de Ambiente (Configuração Crítica)

O sistema deve ser configurado com as seguintes variáveis de ambiente. Elas podem ser inseridas em um arquivo `.env` na raiz do sistema ou configuradas diretamente no painel de controle do servidor (App Service, VPS, etc).

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_MODE` | Define o modo do sistema. Deve ser `production`. | `production` |
| `NEXTAUTH_URL` | A URL completa do site em produção. | `https://gpi.detran.sp.gov.br` |
| `NEXTAUTH_SECRET` | Uma chave aleatória longa para segurança. | `uK8jR2p9Z5x...` |
| `AZURE_AD_CLIENT_ID` | Client ID gerado no Portal Azure (App Registration). | `00000000-0000-0000...` |
| `AZURE_AD_CLIENT_SECRET` | Secret gerado no Portal Azure. | `XyZ123...` |
| `AZURE_AD_TENANT_ID` | Tenant ID do DETRAN-SP no Azure. | `99999999-9999-9999...` |
| `SMTP_HOST` | Servidor de e-mail institucional. | `smtp.detran.sp.gov.br` |
| `SMTP_PORT` | Porta do servidor de e-mail. | `587` ou `465` |
| `SMTP_USER` | Usuário da conta de e-mail. | `gpi-noreply@detran.sp.gov.br` |
| `SMTP_PASS` | Senha da conta de e-mail. | `********` |
| `SMTP_FROM` | Nome e e-mail que aparecerão no remetente. | `"GPI - Detran SP" <gpi@detran.sp.gov.br>` |
| `SMTP_SECURE` | Define se usa SSL (true para porta 465). | `false` |

## 2. Configuração no Portal Azure (Entra ID)

1. No **App Registration**, configure a **Redirect URI** como:
   `[Sua_URL_Producao]/api/auth/callback/azure-ad`
2. Garanta que as permissões de API incluam `User.Read` (padrão).

## 3. Segurança e Governança

- O modo `production` desativa automaticamente a lista de "Acesso Rápido (DEV)".
- O acesso será permitido apenas para e-mails cadastrados no arquivo `users.json`.
- O Administrador Total designado é: **anderson.soares@detran.sp.gov.br**.

## 4. Estrutura de Pastas

Para rodar o sistema, execute:
```bash
node server.js
```
O sistema utiliza os arquivos `data.json` e `users.json` na raiz para persistência de dados. Garanta que o processo tenha permissão de escrita nestes arquivos.
