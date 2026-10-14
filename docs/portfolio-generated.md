# Portfolio Knowledge

## Identity
Name: Marvin Silverio
Nickname: Mj
Role: Technical VA / Automation Specialist
Summary: I build workflow automations and web interfaces that turn repetitive processes into reliable, usable systems. My current work focuses on n8n, JavaScript, AI-assisted workflows, APIs, and modern frontend development.

## Projects

### Panoptes OS
Type: AI-assisted incident recovery & operator control
Summary: Turns failed automations into reviewable incidents with execution evidence, AI-assisted diagnosis, deterministic recovery safeguards, and human approval.
Technologies: React, TypeScript, Vite, Node.js, Fastify, n8n, Supabase Auth, Supabase, PostgreSQL, Groq API, Docker, Playwright
Source: https://github.com/emjayyy02/panoptes-os
Case study: /projects/panoptes-os
Featured: Yes
Question: What is Panoptes OS?
Answer: An AI-assisted incident recovery and operator-control system for n8n automations. It connects persistent incidents, execution evidence, diagnosis, deterministic recovery policy, human decisions, verification, and audit history.
Question: Why was it built?
Answer: A failure alert does not establish whether repeating an operation is safe or whether recovery worked. Panoptes brings the evidence, safeguards, authorization, and outcome into one reviewable incident lifecycle.
Question: What authority does AI have?
Answer: AI interprets evidence and recommends an action through validated structured output. It cannot change trusted configuration, budgets, credentials, or permissions, authorize itself, approve its recommendation, or execute recovery.
Question: Who controls recovery and human approval?
Answer: Deterministic workflow policy and independent execution gates control recovery. Allowlisted authenticated operators approve or reject decisions where required. Approval cannot bypass UNSAFE classification or an exhausted retry budget.
Question: What does deployment-ready mean here?
Answer: Panoptes OS v1 is deployment-ready and locally verified in production mode. Always-on public hosting is intentionally not maintained for this US$0/month portfolio project. The compiled application and container were tested locally. Public HTTPS/ingress, hosted operation, fresh-instance workflow import, and a complete database migration were not verified or provided.
Question: Where can the source and verification evidence be inspected?
Answer: The public repository is https://github.com/emjayyy02/panoptes-os. Its v1.0.0 release includes sanitized workflows and synthetic screenshots. The release-pinned docs/testing.md explains test scope and provenance; the source and evidence links on this page open those records.
Question: What verification was recorded for Panoptes?
Answer: The local production-mode freeze recorded 24 gateway/static-security tests, 170 browser assertions, and 16 container checks. These separate measures overlap and must not be summed. Tests used isolated local HTTPS Auth/n8n fixtures and local Docker; action requests went only to synthetic fixtures. Historical live decisions, user-executed database permission evidence, and real authenticated read-only checks have different provenance. Hosted verification was not performed.
Question: How is Panoptes architected?
Answer: The authenticated React/TypeScript Operator Console calls a Node.js/Fastify gateway. Fixed gateway routes invoke n8n operator workflows, with Supabase/PostgreSQL storing incidents, trusted workflow configuration, and incident events. Supabase Auth supplies verified identity; Groq supplies diagnostic model inference.
Question: How does guarded recovery work?
Answer: Error Intake collects evidence and validates diagnosis before deterministic policy chooses escalation, approval, or retry. Retry Execution independently checks integer retry budgets, safety, trusted idempotency, and approval conditions. Verify Recovery distinguishes RECOVERED, RECOVERY_PENDING, and ESCALATED outcomes. Pending does not prove an autonomous scheduler is running.
Question: How are recovery and audit history bounded?
Answer: Deterministic incident identity and duplicate-aware event writes preserve reviewable state and history. They do not establish cryptographic immutability, tamper-proof history, exactly-once processing, or race-free decisions. Approval preflight does not reserve an incident, and approval POSTs are never automatically retried.
Question: What engineering lessons does Panoptes demonstrate?
Answer: Separate probabilistic diagnosis from deterministic authority, repeat safety checks at execution, distinguish authorization from execution and verified outcomes, preserve uncertain acknowledgements, and keep synthetic/local evidence separate from hosted or real-client claims.
Engineering takeaways:
- Keep AI interpretation separate from execution authority.
- Enforce recovery safeguards again where execution happens.
- Treat approval, retry execution, and verified recovery as distinct states.
- Preserve uncertainty when an action acknowledgement is lost.
- Document what local testing proves and what remains unverified.

### RetailRAG
Type: RAG decision-support system
Summary: A production-style RAG system with grounded retrieval, security controls, automated evaluation, citation validation, and operational observability.
Technologies: n8n, RAG, Supabase, pgvector, Gemini API, Groq API, GPT-OSS, Google Drive, Postman, GitHub
Source: https://github.com/emjayyy02/project-07-retailrag
Case study: /projects/retailrag
Engineering takeaways:
- RAG reliability depends on the controls around retrieval and generation, not only the model.
- Model-created citations should be verified against evidence the system actually retrieved.
- Knowledge boundaries and approval rules should remain trusted application state rather than visitor-controlled prompt text.
- Evaluation and production regression make AI behavior inspectable instead of relying on convincing one-off demos.
- A useful AI system must know when evidence is insufficient and fail safely when dependencies or model output cannot be trusted.

### Revenue Recovery OS
Type: Customer recovery operations system
Summary: Connects customer signals to explainable risk, human-approved recovery actions, and confirmed outcomes in a secured read-only demo.
Technologies: React, TypeScript, Cloudflare Workers, Supabase, PostgreSQL, n8n, Slack, Vitest, Vercel
Source: https://github.com/emjayyy02/project-06-revenue-recovery-os
Case study: /projects/revenue-recovery-os
Question: How does this actually solve a business problem?
Answer: It turns fragmented customer-risk signals into prioritized recovery work, giving account owners one place to see which accounts need attention, why they were prioritized, and what action is pending.
Question: What does the automation actually control?
Answer: Business state and decision rules stay in the application and database, while n8n handles approved external work and callbacks record technical results and confirmed business outcomes.
Question: Is this using real customer or revenue data?
Answer: No. The public demo uses fictional and sanitized portfolio data and is read-only, demonstrating the implemented architecture without claiming real customers or recovered revenue.
Engineering takeaways:
- Explainable rules make customer-risk prioritization inspectable.
- A workflow can perform external work while the application remains the system of record.
- Technical delivery and confirmed business recovery need separate states and metrics.
- AI assistance stays useful when deterministic fallback and human authority remain intact.
- Deployment boundaries, database permissions, and sanitized exports are part of product reliability.

### Offangle
Type: Valorant coaching landing page
Summary: A responsive Valorant coaching landing page built around clear positioning, strong visual hierarchy, and a focused conversion path.
Technologies: HTML, CSS, JavaScript

### AI Support Operations Triage System
Type: AI-assisted workflow automation
Summary: Structured AI interpretation surrounded by deterministic validation, review policy, routing, and failure handling.
Technologies: n8n, JavaScript, OpenRouter, Google Sheets, Webhooks, JSON
Source: https://github.com/emjayyy02/project-05-ai-support-operations
Case study: /projects/ai-support-operations
Engineering takeaways:
- Structured model output still needs deterministic validation.
- AI uncertainty and business-required human review are different decisions.
- Prompts improve more reliably when failures are measured against a fixed benchmark.
- Response generation needs its own safety boundary.
- Freezing a documented version can be better engineering than tuning indefinitely.

### Invoice Collections Automation
Type: Finance workflow automation
Summary: Automates invoice intake, validation, discrepancy checks, and priority routing.
Technologies: n8n, JavaScript, Google Sheets, Gmail, HTTP APIs, Webhooks
Source: https://github.com/emjayyy02/project-04-invoice-collections-automation
Case study: /projects/invoice-collections-automation
Engineering takeaways:
- Reliable automation is defined by its failure paths, not only its happy path.
- Accepted business data and downstream delivery state should be separate concerns.
- Idempotency protects data quality and external side effects.
- Retries need eligibility, delay, a success exit, and a hard limit.

### Workflow Operations Manager
Type: Frontend operations dashboard
Summary: A lightweight operations dashboard powered by stored data, derived metrics, and workflow controls.
Technologies: JavaScript, HTML, CSS, Local Storage, Open-Meteo API
Source: https://github.com/emjayyy02/project-03-workflow-ops-manager
Case study: /projects/workflow-operations-manager
Engineering takeaways:
- One nested data model can power many views when derived values are recalculated consistently.
- Shared refresh boundaries reduce cross-feature synchronization bugs.
- Display filtering and sorting should not mutate source data.
- Keyboard shortcuts need context guards as much as key handlers.
- Separating state, logic, storage, and UI makes a vanilla application easier to evolve.

### NovaTech Solutions
Type: Fictional automation agency
Summary: A responsive automation-agency website focused on clear service positioning, conversion flow, and polished frontend interaction.
Technologies: HTML, CSS, JavaScript

### Personal Developer Profile
Type: React portfolio system
Summary: A responsive React portfolio with centralized content, scalable project routes, accessible themes, and restrained motion.
Technologies: React, TypeScript, Vite, Tailwind CSS, Motion, Lenis, CSS, Local Storage, GitHub
Source: https://github.com/emjayyy02/project-01-personal-developer-profile
Case study: /projects/personal-developer-profile
Engineering takeaways:
- Content and page markup are easier to maintain when they have separate responsibilities.
- Browser acceptance remains necessary after TypeScript and build checks pass.
- A restrained system can feel personal when its few distinctive elements stay consistent.
- Project navigation should scale before the homepage becomes an archive.
- Accessibility and reduced motion belong in the architecture, not a final checklist.

## Skills & Capabilities

### Frontend
- HTML: Semantic page structure
- CSS: Responsive interface styling
- JavaScript: Browser logic and interaction
- React: Component-based interfaces
- TypeScript: Typed application code
- Tailwind CSS: Utility-first interface systems
- Vite: Frontend build tooling

### Backend, Data & Deployment
- Python: Scripts and automation logic
- Supabase: Backend and database services
- Cloudflare Workers: Serverless edge functions
- Vercel: Frontend and serverless deployment

### Automation
- n8n: Workflow automation
- Make: Visual automation and data workflows
- Zapier: App-to-app workflows

### AI / LLM Workflows
- RAG: Grounded retrieval with vector search and citation validation
- AI Agents: Agent-based AI workflows and automation
- OpenAI: AI models and API integrations
- Gemini API: Google AI model integrations
- OpenRouter: Multi-model routing and integration
- Groq API: Fast LLM inference integrations
- Prompt Engineering: Task-focused model instructions

### APIs & Data
- HTTP: Web request fundamentals
- Webhooks: Event-driven integrations
- REST APIs: Service integration
- JSON: Structured data exchange

### CRM & Operations
- HubSpot: CRM, deals and sales automation
- Airtable: Operational data and lightweight CRM
- GoHighLevel: CRM and workflow familiarity

### Business Tools
- Google Sheets: Operational data and tracking
- Gmail: Email workflow integration
- Google Workspace: Collaborative business tools
- Microsoft 365: Documents and productivity
- Slack: Team alerts and workflow notifications

### Design / Build Tools
- Canva: Visual asset creation

### Development Tools & Version Control
- Git: Version control
- GitHub: Source collaboration
- Visual Studio Code: Code editing
- npm: Package management

## Certifications

### In Practice: AI, Testing & Best Practices
Provider: n8n Academy
Issued: Aug 2026

## Education

### Bachelor of Science in Information Systems
Institution: Dr. Filemon C. Aguilar Memorial College of Las Piñas
Period: 2025 — 2029
Location: Las Piñas City, Philippines

## Personal Context

Age: 19
Location: Las Piñas City, Philippines
Current status: College student studying Information Systems