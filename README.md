# Central de Cotações e Requisições de Compra

Sistema web para organizar o processo completo de cotação, requisição, aprovação, compra e recebimento de peças/produtos.

## Stack

- **Next.js 16** (App Router, Server Components)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- **Mock data** no MVP, com o módulo de Aprovação já integrado ao Supabase/PostgreSQL

## Módulos

| Módulo | Rota |
|---|---|
| Dashboard | `/dashboard` |
| Fornecedores | `/fornecedores` |
| Peças | `/pecas` |
| Cotações | `/cotacoes` |
| Orçamentos | `/orcamentos` |
| Comparador | `/comparador` |
| Requisições | `/requisicoes` |
| Aprovação | `/aprovacao` |
| Recebimento | `/recebimento` |
| Configurações | `/configuracoes` |

## Perfis de usuário (demo)

| E-mail | Perfil | Senha |
|---|---|---|
| carlos@empresa.com | Admin | 1234 |
| ana@empresa.com | Compras | 1234 |
| joao@empresa.com | Solicitante | 1234 |
| marcos@empresa.com | Aprovador | 1234 |
| paulo@empresa.com | Recebimento | 1234 |
| sandra@empresa.com | Visualizador | 1234 |

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse: http://localhost:3000

## Banco de dados

O módulo de Aprovação de requisições já usa Supabase/PostgreSQL.

1. Crie um projeto no Supabase.
2. Rode o SQL em `supabase/migrations/202605180001_approval_requisitions.sql`.
3. Configure as variáveis de ambiente:

```bash
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
```
