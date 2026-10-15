# 🚀 CONTEXTO DO PROJETO: AFIC CONSULTORIA FINANCEIRA
> **Instruções para o Gemini:** Este documento descreve minuciosamente o sistema **AFIC Consultoria Financeira** (arquitetura, regras de negócio, banco de dados, personas, telas e tecnologias). Utilize este contexto como base para propor melhorias arquiteturais, novas funcionalidades financeiras, otimizações de UX/UI, segurança e estratégias de crescimento e retenção.

---

## 📌 1. Visão Geral do Produto
O **AFIC Consultoria Financeira** é uma plataforma SaaS híbrida (B2C e B2B2C) de **Planejamento Financeiro e Wealth Management**.
O objetivo central é transformar a relação do cliente com seu dinheiro por meio de:
1. **Diagnóstico e Organização Financeira:** Metodologia dos 5 Baldes de orçamento (Custo Fixo, Conforto, Metas, Lazer e Investimentos).
2. **Inteligência em Investimentos:** Carteiras recomendadas por perfil de risco (Conservador, Moderado, Arrojado) baseadas na estratégia **BESST** (Bancos, Energia, Saneamento, Seguros, Telecom), FIIs e ativos globais, com rebalanceamento e cotações da B3 em tempo real.
3. **Tomada de Decisão Patrimonial (O Plano):** Simuladores avançados para compra vs. aluguel de imóveis, consórcio vs. financiamento, estratégias de amortização acelerada e custo real de veículos.
4. **Hub Tributário (IRPF):** Cofre de documentos dedutíveis com armazenamento em nuvem e otimização de PGBL (12%).
5. **Acompanhamento por Consultor Humano:** Interface dedicada para consultores financeiros realizarem diagnósticos 360°, criarem planos de ação, registrarem atas de reunião e manterem contato próximo com clientes (inclusive via WhatsApp).

---

## 👥 2. Personas e Níveis de Acesso (RBAC)

| Perfil (`role`) | Descrição e Permissões |
|---|---|
| **Cliente (`client`)** | Realiza onboarding financeiro, visualiza seu dashboard e Score de Saúde, lança transações ou importa extratos OFX bancários, simula metas e independência financeira, acessa carteiras recomendadas (sob assinatura ativa), estuda na Academy e armazena comprovantes de IRPF. |
| **Consultor (`consultant`)** | Gerencia sua carteira de clientes, visualiza diagnósticos aprofundados, personaliza os percentuais de baldes de cada cliente, define Planos de Ação (tarefas com prazos), redige atas de reuniões, e envia orientações personalizadas. |
| **Administrador (`admin`)** | Painel de controle global (MRR, total de usuários, assinantes), gestão de acessos e permissões, simulação de papéis (Role Impersonation/Mock Role), liberação manual de carteiras, reset de senhas de usuários e gestão de assinaturas Stripe. |

---

## 💻 3. Stack Tecnológica e Infraestrutura

### Frontend:
- **Framework:** React 19 (`react` 19.2.8, `react-dom` 19.2.8) com TypeScript (`~6.0.2`).
- **Build Tool:** Vite (`8.2.0`) com Fast HMR e suporte a PWA (`vite-plugin-pwa`).
- **Roteamento:** React Router DOM (`v7.18.2`) com layouts aninhados e rotas protegidas (`PrivateRoute`).
- **Estilização & Design System:** Vanilla CSS com tokens customizados (CSS Variables), suporte a Dark/Light Mode, glassmorphism, microanimações e responsividade (Mobile Drawer e BottomNav).
- **Gráficos & Visualização:** Recharts (`3.10.1`) para gráficos de pizza, rosca, barras e áreas.
- **Ícones & Notificações:** `lucide-react` e `react-hot-toast`.
- **Parsing de Arquivos:** Parser nativo em TypeScript para extratos bancários em formato `.OFX`.

### Backend & Nuvem:
- **BaaS (Backend as a Service):** Supabase (PostgreSQL 15+).
- **Autenticação:** Supabase Auth (Email e Senha, tokens JWT, persistência em sessão).
- **Segurança:** Row Level Security (RLS) habilitado em 100% das tabelas.
- **Storage:** Supabase Storage (Bucket privado `tax-documents` para recibos fiscais com RLS).
- **Serverless Edge Functions (Deno):**
  - `stripe-webhook`: Processa eventos de assinatura (criação, renovação, falha).
  - `cancel-stripe-subscription`: Cancelamento gracioso de assinaturas no Stripe.

### APIs e Integrações Externas:
- **Brapi API:** Cotações em tempo real de ações da B3, FIIs e ETFs, indicadores fundamentalistas (P/L, P/VP, DY, variação diária).
- **Stripe:** Checkout de assinaturas para acesso à carteira recomendada e portal de cobrança.
- **Hospedagem & Analytics:** Vercel com `@vercel/analytics`.

---

## 🗄️ 4. Estrutura do Banco de Dados (Supabase)

### Principais Tabelas:
1. **`public.users`:**
   - `id` (UUID, PK referenciando `auth.users`)
   - `full_name`, `email`, `phone`, `role` (`client` | `consultant` | `admin`)
   - `has_completed_onboarding` (BOOLEAN)
   - `has_portfolio_access` (BOOLEAN)
   - `subscription_status` (`active` | `cancelled` | `inactive`)
   - `subscription_canceled_at` (TIMESTAMP)
   - `must_change_password` (BOOLEAN)

2. **`public.financial_profiles`:**
   - `user_id` (UUID, FK `users.id`)
   - `monthly_income`, `fixed_costs`, `total_debt`, `total_equity` (DECIMAL)
   - `health_score` (INT 0-100), `status` (`excellent` | `good` | `attention` | `critical`)
   - `buckets` (JSONB): Configuração personalizada dos 5 baldes `[ { type, label, percentage } ]`.
   - `risk_profile` (`conservador` | `moderado` | `arrojado`)

3. **`public.transactions`:**
   - `id`, `user_id`, `description`, `amount`, `type` (`income` | `expense`)
   - `category`, `payment_method`, `date`, `fitid` (para evitar duplicidade de transações OFX)

4. **`public.client_goals`:**
   - `id`, `user_id`, `title`, `target_amount`, `current_amount`, `deadline`, `monthly_contribution`, `category`

5. **`public.action_plans`:**
   - `id`, `user_id`, `title`, `description`, `status` (`pending` | `completed`), `category` (`urgent` | `organization` | `growth`), `due_date`

6. **`public.consultant_meeting_notes`:**
   - `id`, `client_id`, `consultant_id`, `meeting_date`, `title`, `summary`, `decisions`, `next_steps`, `private_notes`

7. **`public.client_messages`:**
   - `id`, `client_id`, `consultant_id`, `message`, `is_read`, `created_at`

8. **`public.tax_documents`:**
   - `id`, `user_id`, `title`, `category` (`saude` | `educacao` | `pgbl` | `dependente` | `outros`), `amount`, `provider_name`, `document_date`, `file_url`, `notes`

9. **`public.client_portfolio`:**
   - `id`, `user_id`, `ticker`, `category`, `quantity`, `average_price`, `target_weight`, `notes`

---

## 🧩 5. Módulos e Funcionalidades Detalhadas

### 5.1. Onboarding do Cliente (`/onboarding`)
- Questionário dinâmico em etapas guiadas.
- Coleta de dados essenciais: renda líquida mensal, custos fixos mensais, patrimônio acumulado, dívidas totais, objetivos principais e tolerância ao risco.
- Cálculo automático imediato do **Score de Saúde Financeira** e cálculo do balde padrão (50% Fixo, 10% Conforto, 20% Metas, 10% Lazer, 10% Investimentos).

### 5.2. Dashboard do Cliente (`/client`)
- **Health Score Card:** Nota de 0 a 100 com semáforo visual (Crítico, Atenção, Bom, Excelente).
- **Métricas Chave:** Taxa de Poupança (`%`), Cobertura da Reserva de Emergência (em meses de custo fixo), Renda Mensal.
- **Gráfico dos 5 Baldes:** Visualização interativa com Donut Chart da divisão ideal configurada pelo consultor versus a realidade.
- **Plano de Ação do Consultor:** Checklist de metas táticas a serem cumpridas pelo cliente.
- **Avisos e Mensagens:** Mensagens diretas enviadas pelo consultor financeiro.

### 5.3. Gerenciador de Transações & Importador OFX (`/client/expenses`)
- Lançamento rápido de despesas e receitas com categorização inteligente.
- **Importador OFX:** Lê arquivos `.ofx` exportados de bancos (ex: Itaú, Nubank, Bradesco, Inter), remove transações duplicadas pelo `FITID` e categoriza automaticamente.
- Gráficos de distribuição de gastos e fluxo de caixa.

### 5.4. Calculadoras Financeiras Interativas
- **Calculadora dos Baldes (`/client/calculator`):** Ajuste fino de percentuais com sliders para ver o impacto em Reais de cada categoria de gasto.
- **Goal Tracker (`/client/goals`):** Gestão de metas de curto, médio e longo prazo, cálculo de aporte mensal necessário para atingir no prazo, e barras de progresso visual.
- **Simulador de Investimentos (`/client/simulator`):** Projeção de juros compostos com aportes mensais, taxa anual e tempo.
- **Calculadora de Tempo / FIRE (`/client/time-calculator`):** Calcula quantos anos faltam para viver de renda passiva com base na taxa de poupança e custo de vida.

### 5.5. "O Plano" - Grandes Conquistas Patrimoniais (`/client/the-plan`)
- **Hack de Amortização:** Simulação do impacto de amortizar prestações no modelo SAC/Price, mostrando redução brutal de juros e redução de anos do financiamento.
- **Comprar vs. Alugar:** Comparativo financeiro entre financiar um imóvel ou morar de aluguel e investir a diferença patrimonial.
- **Financiamento vs. Consórcio:** Análise de taxas de administração, probabilidade de contemplação por lance e custo efetivo total.
- **Simulador Veicular & Custo de Posse (TCO):** Revela o custo oculto de ter um carro (depreciação, IPVA, seguro, combustível, oportunidade do capital parado).
- **Quiz de Recomendação Inteligente:** Diagnóstico rápido para orientar a melhor escolha do cliente.

### 5.6. Carteira Recomendada & Rebalanceamento (`/client/portfolio` e `/consultor/portfolio`)
- Perfis de Carteira: **Fortaleza (Conservadora)**, **Equilíbrio (Moderada)** e **Expansão & Alpha (Arrojada)**.
- Baseada na estratégia **BESST** (empresas à prova de crises que pagam dividendos sólidos) + FIIs + Renda Fixa com liquidez e títulos IPCA+ + Ativos Internacionais (S&P 500 / Global).
- Integração com a **Brapi** para cotações em tempo real e cálculo de indicadores de Valuation.
- **Simulador de Rebalanceamento Inteligente:** O usuário digita quanto quer aportar no mês (ex: R$ 2.000,00) e o algoritmo calcula exatamente quais ativos comprar e quantas cotas para aproximar a carteira do peso ideal (`targetWeight`), sem necessidade de vender ativos.
- Controle de acesso por assinatura / paywall Stripe.

### 5.7. Hub de Imposto de Renda (`/client/income-tax`)
- **Cofre Fiscal:** Upload e categorização de comprovantes dedutíveis (Saúde, Educação, PGBL, Dependentes) direto no Supabase Storage.
- **Otimizador PGBL:** Cálculo da dedução máxima permitida de 12% da renda bruta para abatimento no IRPF.
- Tabela de documentos com exportação e filtro por ano de exercício.

### 5.8. Academy / Educação Financeira (`/client/education`)
- Microaulas em vídeo (estilo direto ao ponto) e artigos explicativos sobre estratégias de investimento, armadilhas da poupança, fundamentos de FIIs e controle orçamentário.
- Filtros por nível e categoria, além de registro de aulas concluídas.

### 5.9. Workspace do Consultor (`/consultor`)
- **Visão Geral:** Métricas de todos os clientes sob responsabilidade do consultor, status do onboarding, clientes em situação de atenção/crítica.
- **Diagnóstico do Cliente 360° (`/consultor/client/:id`):**
  - Ajuste personalizado dos baldes do cliente.
  - Criação de planos de ação (Urgente, Organização, Crescimento).
  - Gestão de atas de reuniões (resumo, decisões tomadas, próximos passos, anotações privadas).
  - Central de mensagens rápidas com templates prontos para envio direto via WhatsApp Web com link formatado.

### 5.10. Painel do Administrador (`/admin`)
- Indicadores de faturamento e assinaturas.
- Listagem completa de usuários com busca e filtros por papel.
- Troca de papel para testes (Impersonation sem deslogar).
- Ativação ou desativação manual de acesso a carteiras recomendadas.
- Gerador e reset de senhas de usuários.

---

## 🔍 6. Diagnóstico do Estado Atual (Pontos Fortes & Oportunidades)

### ✅ Pontos Fortes:
- Conjunto de funcionalidades financeiras completo e muito alinhado com a realidade do mercado brasileiro (metodologia dos 5 Baldes, BESST, Amortização SAC, PGBL 12%, OFX).
- Interface moderna, design responsivo com suporte a dispositivos móveis (Navbar, Drawer e Bottom Navigation).
- Separação clara de papéis e regras RLS no Supabase.
- Cálculos matemáticos sólidos e bem estruturados.

### ⚠️ Oportunidades de Melhoria & Gaps Conhecidos:
1. **Conexão Bancária Automatizada:** A importação atual depende de arquivo manual OFX; falta integração com **Open Finance Brasil** (ex: Pluggy ou Belvo) para sincronização automática diária de contas e cartões.
2. **Gerenciamento de Estado Global:** Componentes complexos dependem de estados locais com `useState` e múltiplos `useEffect` longos; a adoção de uma biblioteca de estado de servidor (ex: TanStack Query / React Query) evitaria re-fetchings desnecessários e melhoraria o cache.
3. **IA Advisor Integrada:** O sistema tem um vasto volume de dados financeiros do cliente (renda, custos, investimentos, transações), mas ainda não possui um assistente de IA embarcado que gere insights proativos diários (ex: "Você gastou 35% mais com lazer este mês", "Oportunidade: aporte no Tesouro IPCA+ com prêmio histórico").
4. **Exportação de Relatórios Executivos:** Falta um gerador de PDF profissional para o consultor exportar um "Relatório Executivo Mensal de Wealth Management" com 1 clique para entregar ao cliente.
5. **Gamificação e Engajamento do Cliente:** O preenchimento de metas e despesas pode se tornar monótono sem mecânicas de conquistas, badges de evolução financeira e notificações push ou lembretes via WhatsApp/Telegram.
6. **Suporte a Múltiplas Moedas / Criptoativos:** O portfólio atual é muito focado em B3; investidores que possuem contas no exterior (Avenue, Nomad) ou Bitcoin precisam de suporte a saldo multimoeda.

---

## 🎯 7. O Que Perguntar ao Gemini (Sugestões de Prompts para Copiar e Colar)

Ao enviar este arquivo para o chat do Gemini, utilize um dos comandos abaixo para direcionar a análise:

### Opção A: Auditoria Geral e Sugestões Estratégicas
> *"Com base no documento do projeto AFIC Consultoria Financeira anexo, faça uma análise crítica completa do sistema. Identifique os 5 maiores pontos fracos da solução atual e proponha 5 melhorias prioritárias divididas em: 1) Arquitetura de Software; 2) Novas Funcionalidades Financeiras; 3) UX/UI e Retenção de Clientes."*

### Opção B: Inovações e Recursos que Geram Receita (Visão de Produto)
> *"Quais funcionalidades financeiras inovadoras (ex: Open Finance, IA de finanças pessoais, automações tributárias, benchmarking de carteiras) colocariam este sistema à frente de concorrentes como Kinvo, Gorila, Mobills e Organizze? Liste em ordem de impacto no negócio e facilidade de implementação."*

### Opção C: Refatoração e Arquitetura Técnica
> *"Avalie a arquitetura técnica descrita (React 19, TypeScript, Vite, Supabase, RLS, Edge Functions). Quais refatorações, padrões de design (design patterns), melhorias de performance e boas práticas de testes automatizados você recomendaria para tornar a base de código escalável para 50.000 usuários ativos?"*

### Opção D: Segurança e Auditoria Supabase / RLS
> *"Quais são os principais riscos de segurança, vulnerabilidades potenciais e cuidados que devemos ter com a autenticação, Row Level Security (RLS) e Edge Functions no Supabase considerando a sensibilidade dos dados financeiros e transações do cliente?"*

### Opção E: Experiência do Consultor & B2B
> *"Como podemos aprimorar o módulo do Consultor Financeiro (`/consultor`) para transformá-lo na ferramenta de trabalho indispensável para consultores de investimentos e planejadores CFP (Certified Financial Planner)?"*
