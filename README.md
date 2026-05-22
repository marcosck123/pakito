# Pakito — Central de Cotações e Requisições de Compra

Sistema web completo para gerenciar o ciclo de compras de peças e materiais: da cotação com fornecedores até o recebimento físico, com aprovação, auditoria e comparação de preços.

> Next.js 16 · React 19 · Firebase Firestore · TypeScript · OCR por foto e PDF

---

## Demonstração

| E-mail | Perfil | Senha |
|---|---|---|
| carlos@empresa.com | Admin | 1234 |
| ana@empresa.com | Compras | 1234 |
| joao@empresa.com | Solicitante | 1234 |
| marcos@empresa.com | Aprovador | 1234 |
| paulo@empresa.com | Recebimento | 1234 |
| sandra@empresa.com | Visualizador | 1234 |

---

## Funcionalidades

### Fluxo principal
- **Cotação** — criação com peças, quantidades e fornecedores; geração automática de mensagem para WhatsApp
- **Orçamento** — inserção via digitação, upload de PDF ou **foto com OCR** (Tesseract.js com pré-processamento de imagem)
- **Comparador de preços** — tabela lado a lado com destaque do menor preço por peça e alertas de valores suspeitos (>30% acima da média)
- **Requisição de compra** — geração formal com justificativa e seleção de itens por fornecedor
- **Aprovação** — fluxo aprovar/reprovar/solicitar ajuste com comentários e histórico completo
- **Recebimento** — controle por item: recebido, parcial, com problema
- **Conferência avançada** — validação dos itens extraídos pelo OCR contra os itens da cotação original

### Gestão
- **Fornecedores** — cadastro com CNPJ, categorias, WhatsApp e histórico de cotações vinculadas
- **Peças** — catálogo com código interno, código original, marca preferencial e estoque mínimo
- **Relatórios** — KPIs de cotações abertas, volume por fornecedor, status de requisições
- **Auditoria** — log centralizado de todas as ações com filtros por entidade e usuário
- **Backup** — exportação completa dos dados via API (JSON)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16 (App Router, Server Components) |
| Frontend | React 19, TypeScript 5, Tailwind CSS v4 |
| Banco de dados | Firebase Firestore (firebase-admin) |
| Autenticação | Sessão customizada HMAC-SHA256 + bcryptjs |
| OCR | Tesseract.js v7 + pré-processamento via Canvas API |
| PDF | pdfjs-dist + parser próprio com regex e scoring de confiança |
| Formulários | React Hook Form + Zod |
| Monitoramento | Sentry |
| Ícones | Lucide React |

---

## Módulos e rotas

| Módulo | Rota | Perfis com acesso |
|---|---|---|
| Dashboard | `/dashboard` | Todos |
| Cotações | `/cotacoes` | Admin, Compras, Solicitante |
| Orçamentos | `/orcamentos` | Admin, Compras |
| Comparador | `/comparador` | Admin, Compras |
| Requisições | `/requisicoes` | Admin, Compras, Solicitante |
| Aprovação | `/aprovacao` | Admin, Aprovador |
| Recebimento | `/recebimento` | Admin, Recebimento |
| Fornecedores | `/fornecedores` | Admin, Compras |
| Peças | `/pecas` | Admin, Compras |
| Relatórios | `/relatorios` | Admin, Compras, Visualizador |
| Auditoria | `/auditoria` | Admin |
| Configurações | `/configuracoes` | Admin |

---

## Controle de acesso (RBAC)

6 perfis com permissões granulares verificadas em todas as rotas de API e no frontend:

| Perfil | Descrição |
|---|---|
| `ADMIN` | Acesso total |
| `COMPRAS` | Gerencia cotações, orçamentos e fornecedores |
| `SOLICITANTE` | Cria cotações e requisições |
| `APROVADOR` | Aprova ou reprova requisições |
| `RECEBIMENTO` | Confirma entrega de peças |
| `VISUALIZADOR` | Somente leitura |

---

## Como rodar localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.local.example .env.local
# Edite .env.local com suas credenciais Firebase

# 3. Iniciar o servidor
npm run dev
```

Acesse: [http://localhost:3000](http://localhost:3000)

> Sem credenciais Firebase configuradas, o sistema roda com dados de demonstração (mock) automaticamente.

---

## Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative o **Firestore Database** (modo produção)
3. Gere uma chave de serviço: Configurações do projeto → Contas de serviço → **Gerar nova chave privada**
4. Preencha o `.env.local` com os dados do JSON gerado:

```env
FIREBASE_PROJECT_ID=seu-projeto
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

SESSION_SECRET=string-aleatoria-minimo-32-caracteres
```

5. Popule o banco com dados iniciais (faça login como Admin primeiro):

```bash
curl -X POST http://localhost:3000/api/admin/seed \
  -H "Cookie: cotacoes_session=<seu-cookie>"
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|---|---|---|
| `FIREBASE_PROJECT_ID` | Sim | ID do projeto Firebase |
| `FIREBASE_CLIENT_EMAIL` | Sim | E-mail da service account |
| `FIREBASE_PRIVATE_KEY` | Sim | Chave privada da service account |
| `SESSION_SECRET` | Sim | Segredo para assinar cookies de sessão |
| `SENTRY_DSN` | Não | DSN para monitoramento de erros (servidor) |
| `NEXT_PUBLIC_SENTRY_DSN` | Não | DSN público do Sentry (cliente) |

---

## Arquitetura

```
src/
├── app/
│   ├── (app)/          # Páginas autenticadas (Server Components)
│   └── api/            # Rotas de API (Route Handlers)
├── components/
│   ├── cotacao/        # Fluxo de cotação e orçamento (com OCR)
│   ├── recebimento/    # Controle de entrega
│   └── ui/             # Componentes base (StatusBadge, StatCard)
├── lib/
│   ├── auth/           # Sessão, login, permissões
│   ├── db/             # Repositórios Firebase (um arquivo por entidade)
│   ├── mock-data/      # Dados de seed e fallback de desenvolvimento
│   ├── ocr/            # Pré-processamento de imagem + Tesseract
│   ├── pdf/            # Parser de orçamentos PDF
│   └── security/       # RBAC e mapeamento de permissões
└── types/              # Interfaces TypeScript centralizadas
```

**Padrão de repositório:** cada entidade tem seu próprio arquivo em `src/lib/db/` com funções tipadas de `get`, `create` e `update`. Server Components chamam os repositórios diretamente; ações do usuário passam por Route Handlers com validação Zod.

---

## FAQ Técnico

### Stack e Tecnologia

**Quais tecnologias o sistema usa?**  
Next.js 16 com App Router, React 19, TypeScript 5, Tailwind CSS v4 e Firebase Firestore. 100% web, sem necessidade de instalação. Responsivo para celular, tablet e desktop.

**O que é o OCR e como funciona?**  
O sistema permite fotografar um orçamento em papel e extrair automaticamente itens, quantidades e preços. O processamento ocorre inteiramente no navegador com Tesseract.js — a imagem não é enviada a nenhum servidor externo. Antes do OCR, a imagem passa por pré-processamento (escala para mínimo 2000px, conversão para escala de cinza, aumento de contraste e nitidez) para maximizar a precisão.

**Como funciona o parser de PDF?**  
Um parser próprio com regex e algoritmo de scoring analisa o texto extraído do PDF, identifica linhas de itens, infere quantidades e preços unitário/total, calcula confiança de 0 a 1 para cada item e faz match automático com as peças da cotação de origem.

### Segurança

**Os dados estão seguros?**  
Os dados ficam no Firebase Firestore (Google Cloud). Trafegam com TLS e são armazenados com criptografia em repouso. O Google Cloud possui certificações SOC 1, SOC 2 e ISO 27001.

**Como funciona a autenticação?**  
Cookies HTTP-only assinados com HMAC-SHA256. As senhas são armazenadas com hash bcrypt. O servidor valida a assinatura a cada requisição sem consultar o banco.

**O sistema está protegido contra ataques comuns?**  
Sim. Toda entrada é validada com Zod antes de chegar ao banco. Cookies são HTTP-only e assinados digitalmente. Next.js fornece proteções nativas contra XSS.

**As chaves de API ficam expostas?**  
Não. As credenciais Firebase ficam exclusivamente em variáveis de ambiente do servidor, nunca no código do cliente.

### Banco de dados e infraestrutura

**Os dados podem ser exportados?**  
Sim. O endpoint `GET /api/admin/backup` (restrito ao Admin) exporta tudo em JSON. Sem vendor lock-in.

**O sistema aguenta muitos acessos simultâneos?**  
Sim. Next.js com Server Components escala horizontalmente. O Firestore escala automaticamente sem limite de conexões.

### Funcionalidades

**Como funciona o fluxo completo?**  
1. Solicitante cria uma cotação com peças e fornecedores  
2. Compras insere orçamentos recebidos (digitando, PDF ou foto)  
3. O comparador mostra o melhor preço por peça com alertas automáticos  
4. Compras gera uma requisição formal com os itens selecionados  
5. Aprovador analisa e aprova/reprova com comentários  
6. Recebimento confirma a entrega de cada item  
7. Toda a operação fica registrada no log de auditoria  

**O sistema gera mensagens para WhatsApp?**  
Sim. No fluxo de cotação, o sistema gera automaticamente uma mensagem formatada com todos os itens e abre o WhatsApp Web do fornecedor com a mensagem pré-preenchida.

### Manutenção e evolução

**O código é bem estruturado?**  
Sim. Arquitetura de repositórios com separação clara entre Server Components (leitura), Route Handlers (escrita com validação) e componentes cliente (interatividade). Zero erros de TypeScript em modo strict.

**O sistema tem monitoramento de erros?**  
Sim. Sentry integrado para captura de erros no servidor e no cliente, com stack traces e contexto de sessão.

---

## Roadmap

### Concluído
- Fluxo completo: cotação → orçamento → requisição → aprovação → recebimento
- Leitura de orçamentos via PDF e foto (OCR) com pré-processamento de imagem
- Parser de tabelas com scoring de confiança, extração de frete e desconto
- Firebase Firestore com repositórios tipados para todas as entidades
- Autenticação HMAC-SHA256 com RBAC de 6 perfis e 20+ permissões
- Comparador de preços com alertas de valores suspeitos
- Tela de conferência avançada de orçamentos
- Relatórios com KPIs e métricas
- Log de auditoria centralizado
- Monitoramento de erros com Sentry
- Seed de dados realistas e backup completo via API

### Planejado
- Notificações por e-mail (aprovações, cotações vencendo)
- Integração com WhatsApp Business API para envio automático
- Versão mobile (PWA ou React Native)
- Dashboard de análise de gastos por categoria e fornecedor

---

## Licença

Proprietário. Todos os direitos reservados.
