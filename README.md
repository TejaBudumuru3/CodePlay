<div align="center">

# ⚡ CodePlay

### *Turn a game idea into a playable browser game — in minutes.*

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![NVIDIA NIM](https://img.shields.io/badge/NVIDIA_NIM-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

</div>

---

## What is CodePlay?

**CodePlay** is an AI-powered multi-agent web application that transforms natural language prompts into fully playable 2D browser games. Powered by a specialized pipeline of AI agents — **Clarifier**, **Planner**, **Coder**, and **Reviewer** — it autonomously designs, builds, and quality-checks complete games in minutes.

No game development experience required. Describe your idea, answer a few targeted multiple-choice questions, and watch your game code stream and render live in your browser.

---

## ✨ Key Features

- **Multi-Agent AI Pipeline** — Four specialized agents work in sequence: Clarifier → Planner → Coder → Reviewer, each with a single, well-defined responsibility.
- **Real-Time Code Streaming** — SSE (Server-Sent Events) live code generation streams single-file HTML/CSS/JS directly to your browser as it's written.
- **Dual Framework Support** — Generates games in both Vanilla Canvas API and Phaser 3, selected automatically based on game complexity and mechanics.
- **Intelligent Clarification** — MCQ-based game design interview builds a confidence score; proceeds only when ≥ 0.8 confidence is reached.
- **Automated Code Review & Rebuild** — Reviewer Agent QA-checks every build and triggers up to **5 review-rebuild iterations** if bugs or syntax issues are found.
- **Multi-Tier LLM Gateway & Caching** — Routes requests dynamically (NVIDIA NIM API for Free tier, Google Gemini API for Pro tier) with SHA-256 hash response caching to eliminate redundant LLM calls.
- **Live Game Preview** — In-browser iframe rendering alongside syntax-highlighted code, updated in real time during generation.
- **Credit System** — Daily refresh: 5 credits for registered users, with Guest authentication mode for seamless onboarding.
- **Session History** — All game creation sessions are persisted in PostgreSQL; revisit and replay any previous game anytime.
- **ZIP Download** — Download the complete self-contained game as a standalone ZIP file.
- **Docker + CI/CD** — Containerized production deployment pipeline with GitHub Actions → Oracle Cloud SSH deploy.

---

## 🏗️ Architecture Overview

![CodePlay System Architecture](./docs/codeplay_architecture_diagram.png)

The session state machine drives the complete lifecycle:

```
INIT → CLARIFYING → PLANNING → BUILDING → REVIEW → REBUILD → COMPLETED (or FAILED)
```

If the Reviewer Agent returns `FAIL`, the session loops to `REBUILD` with targeted fix instructions — up to **5 iterations** before completing.

### Sequence Diagram

The full request lifecycle from user prompt to playable browser game:

```mermaid
sequenceDiagram
    participant User as User (Web Browser)
    participant UI as Next.js 15 Frontend
    participant API as API Routes (/api/chat, /api/stream)
    participant Ctrl as Controller (State Machine)
    participant DB as PostgreSQL (Prisma)
    participant Clar as Clarifier Agent
    participant Plan as Planner Agent
    participant Code as Coder Agent
    participant Rev as Reviewer Agent
    participant LLM as LLM Gateway (NVIDIA / Gemini)

    User->>UI: Enter game prompt ("Build a Snake game with power-ups")
    UI->>API: POST /api/chat {prompt}
    API->>DB: Create Session (Status: INIT)
    API->>Ctrl: start(sessionId)

    rect rgb(6, 182, 212, 0.1)
        Note over Ctrl,Clar: CLARIFICATION PHASE
        Ctrl->>Clar: clarify(prompt)
        Clar->>LLM: System prompt + game idea
        LLM-->>Clar: MCQ questions JSON
        Clar->>DB: Update Session (Status: CLARIFYING)
        Clar-->>UI: Display MCQ questions
        UI-->>User: Show questions with options
        User->>UI: Select options (A, B, C, D)
        UI->>API: POST /api/chat {answers}
        API->>Ctrl: start(sessionId, answers)
        Ctrl->>Clar: clarify(answers, history)
        Clar->>LLM: Synthesize answers
        LLM-->>Clar: Requirements summary (confidence: 1.0)
        Clar->>DB: Update Session (Status: PLANNING)
    end

    rect rgb(59, 130, 246, 0.1)
        Note over Ctrl,Plan: PLANNING PHASE
        Ctrl->>Plan: plan(requirements, gameIdea)
        Plan->>LLM: Requirements + system prompt
        LLM-->>Plan: Technical blueprint JSON
        Plan->>DB: Update Session (plan, Status: BUILDING)
    end

    rect rgb(16, 185, 129, 0.1)
        Note over Ctrl,Code: BUILD PHASE (SSE Stream)
        UI->>API: GET /api/stream?sessionId
        API->>Code: build(plan)
        Code->>LLM: Blueprint + coder system prompt
        loop Real-time SSE code streaming
            LLM-->>Code: Code chunks
            Code-->>UI: SSE: code chunk
            UI-->>User: Live code + iframe preview update
        end
        Code->>DB: Update Session (code, Status: REVIEW)
    end

    rect rgb(245, 158, 11, 0.1)
        Note over Ctrl,Rev: REVIEW PHASE (max 5 iterations)
        API->>Rev: review(plan, code, summary)
        Rev->>LLM: Code + plan + QA prompt
        LLM-->>Rev: PASS / FAIL + feedback
        alt PASS
            Rev->>DB: Update Session (Status: COMPLETED)
            API-->>UI: SSE: complete
            UI-->>User: Playable game rendered
        else FAIL (attempts < 5)
            Rev->>DB: Update Session (Status: REBUILD)
            Rev->>Code: Rebuild with feedback
            Code->>LLM: Previous code + fix instructions
            loop Streaming rebuild
                LLM-->>Code: Fixed code chunks
                Code-->>UI: SSE: code chunk
            end
            Note over Rev: Loop back to review (up to 5 passes)
        end
    end

    User->>UI: Download ZIP / View code / Play game
```

---

## 🤖 Agent Pipeline

Each agent is a focused specialist with a single responsibility. Together, they form an autonomous game development team.

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Clarifier** | Lead Game Designer | Raw natural language game idea | Structured requirements JSON (confidence ≥ 0.8) |
| **Planner** | Senior Game Architect | Clarified requirements | Technical blueprint: framework, mechanics, controls, assets, game loop |
| **Coder** | Elite Game Developer | Technical blueprint | Complete single-file HTML/CSS/JS game |
| **Reviewer** | QA Engineer | Generated code + original plan | `PASS` or `FAIL` with specific, actionable fix instructions |

### How Confidence Works

The Clarifier computes a confidence score based on how well the user's answers cover the essential game design dimensions (genre, mechanics, win/loss conditions, controls, visual style). It continues asking MCQ questions until confidence reaches **0.8**, then hands off to the Planner — ensuring the Coder always receives a complete specification.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Framer Motion |
| **Backend** | Node.js, TypeScript, Turborepo |
| **Database** | PostgreSQL, Prisma ORM 7, Neon DB |
| **AI / LLM Gateway** | NVIDIA NIM API (OpenAI Client SDK), Google GenAI SDK (Gemini Pro) |
| **Auth** | NextAuth v5, Google OAuth, Guest Auth |
| **DevOps** | Docker, GitHub Actions, Oracle Cloud |
| **Streaming** | Server-Sent Events (SSE) |
| **UI Extras** | Prism.js (syntax highlighting), JSZip, Lucide Icons |

---

## 📁 Project Structure

```
CodePlay/
├── apps/
│   └── web/                    # Next.js 15 web application (App Router)
│       └── src/
│           ├── app/            # Pages & API routes (chat, stream, sessions, credits)
│           ├── components/     # ChatInterface, CodeViewer, GamePreview, SessionHistory
│           ├── context/        # GameBuilderContext, CreditsContext
│           ├── lib/            # Utilities, credit management helpers
│           └── auth.ts         # NextAuth v5 configuration
├── packages/
│   ├── agents/                 # Clarifier, Planner, Coder, Reviewer agents
│   ├── controller/             # Session orchestrator & state machine
│   └── model/
│       ├── db/                 # Prisma schema, client, generated client
│       ├── llm/                # LLM Gateway — NVIDIA & Gemini clients, caching & retry logic
│       └── types.ts            # Shared TypeScript interfaces across packages
├── docs/                       # System architecture diagrams & technical docs
├── .github/
│   └── workflows/              # CI/CD: build → push to GHCR → SSH deploy
├── Dockerfile                  # Production multi-stage container
└── turbo.json                  # Turborepo pipeline config
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 22+
- **PostgreSQL** (local or [Neon DB](https://neon.tech) for serverless)
- **NVIDIA NIM API Key** — [get one here](https://build.nvidia.com/) or **Google Gemini API Key** — [get one here](https://aistudio.google.com/)
- **Google OAuth Credentials** (optional, for social login)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/tejabudumuru3/CodePlay.git
cd CodePlay

# 2. Install dependencies (all workspaces)
npm install

# 3. Copy the environment template and fill in your values
cp .env.example .env
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/codeplay"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# LLM Providers (NVIDIA NIM & Google Gemini)
NVDIA_KEY="your-nvidia-nim-api-key"
NVIDIA_CLARIFY_MODEL="qwen/qwen2.5-coder-32b-instruct"
NVIDIA_PLAN_MODEL="moonshotai/kimi-k2-thinking"
NVIDIA_CODE_MODEL="qwen/qwen2.5-coder-32b-instruct"
NVIDIA_REVIEW_MODEL="qwen/qwen2.5-coder-32b-instruct"

# Gemini API Keys (comma-separated for key rotation)
GEMINI_API_KEYS="your-gemini-api-key-1,your-gemini-api-key-2"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Database Setup

```bash
# Push schema to your database and generate Prisma client
npx prisma db push
```

### Running Locally

```bash
# Start the web app in development mode
npm run dev
# App available at http://localhost:3000
```

### Docker Deployment

```bash
# Build the production image
docker build -t codeplay .

# Run the container
docker run -p 3000:3000 --env-file .env codeplay
```

Or use the pre-built image from GitHub Container Registry:

```bash
docker pull ghcr.io/tejabudumuru3/codeplay:latest
docker run -p 3000:3000 --env-file .env ghcr.io/tejabudumuru3/codeplay:latest
```

---

## 🎮 How It Works

1. **Describe your game** — Enter any game idea in plain English ("a snake game where apples give power-ups").
2. **Clarifier Agent interviews you** — Asks targeted MCQ questions about mechanics, controls, difficulty, and visual style.
3. **Confidence threshold reached** — Once the Clarifier is ≥ 80% confident in the spec, the Planner takes over.
4. **Planner creates a blueprint** — Selects framework (Vanilla Canvas or Phaser 3), defines mechanics, systems, assets, and the full game loop.
5. **Coder generates your game** — Streams complete single-file HTML/CSS/JS to your browser in real time; you watch the code appear live.
6. **Reviewer QA-checks the build** — Validates against the plan; if issues are found, triggers a targeted rebuild (up to 5 passes).
7. **Play your game** — The finished game renders directly in your browser. Download it as a ZIP to keep forever.

---

## 🧠 Design Decisions

### Why a Multi-Agent Pipeline Instead of One Big Prompt?

Splitting responsibilities across four specialized agents dramatically improves output quality. Each agent has a focused context window, purpose-built system prompt, and a clear contract with the next stage. A single monolithic prompt trying to clarify, plan, code, and review simultaneously produces inconsistent results — especially for complex game logic.

### Why SSE Instead of WebSockets?

Server-Sent Events are unidirectional (server → client), which is all that's needed for streaming code generation. SSE requires no upgrade handshake, works over standard HTTP/2, and is simpler to deploy behind reverse proxies and CDNs than WebSockets. The tradeoff is that SSE is one-way, but all user interactions (chat messages, navigation) already go through standard REST API endpoints.

### Why SHA-256 Caching for LLM Calls?

LLM inference is expensive and deterministic for identical inputs. By hashing the exact prompt + model + tier parameters, CodePlay avoids re-calling the API for repeated or near-identical game ideas. This cuts API costs and significantly speeds up common game generation requests.

### Why Dual-Tier LLM Gateway (NVIDIA NIM + Google Gemini)?

CodePlay routes traffic intelligently based on tier and model strengths. NVIDIA NIM handles Free tier requests with ultra-fast specialized open models (Qwen 2.5 Coder, Kimi K2 Thinking), while Google Gemini handles Pro tier requests. Built-in model cascade logic automatically falls back if a primary model experiences capacity limits.

### Why Single-File HTML Output?

Generating a single self-contained `index.html` with all CSS and JavaScript inlined makes games trivially portable. Users can download, share, and host their game anywhere without a build step, Node.js, or any dependencies. The iframe `srcdoc` injection in the preview panel works natively with this format.

---

## 🗺️ Roadmap

| Status | Feature |
|--------|---------|
| ✅ Done | Multi-agent pipeline (Clarifier → Planner → Coder → Reviewer) |
| ✅ Done | Real-time SSE code streaming |
| ✅ Done | Dual framework support (Vanilla Canvas + Phaser 3) |
| ✅ Done | Multi-tier LLM gateway (NVIDIA NIM & Google Gemini) with SHA-256 caching |
| ✅ Done | Credit system & NextAuth v5 Guest mode |
| ✅ Done | Docker + GitHub Actions CI/CD |
| 🔄 Planned | Game gallery — browse and remix community-generated games |
| 🔄 Planned | Iterative editing — modify an existing game with follow-up prompts |
| 🔄 Planned | Multi-file project output (separate HTML/CSS/JS assets) |
| 🔄 Planned | Custom model selection per agent in the UI |
| 🔄 Planned | Multiplayer game support |

---

## 📄 License

This project is licensed under the [MIT License](./LICENSE).

---

## 🔗 Connect

Built by [@tejabudumuru3](https://github.com/tejabudumuru3)

---

<div align="center">

*If CodePlay saved you time or sparked an idea, consider giving it a ⭐*

</div>
