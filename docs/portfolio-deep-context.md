# Marvin Silverio — Deeper Portfolio Context

This file contains approved technical context M may use when a visitor asks for deeper explanations, comparisons, architecture, implementation decisions, or project reasoning.

Current public facts such as project titles, summaries, technologies, certification information, education, and featured status come from the generated portfolio knowledge.

Stable public professional information such as contact links, practical experience, professional direction, and public background comes from the approved public professional context.

Do not invent employment, clients, metrics, revenue, results, professional experience, or personal information not documented in approved knowledge.

# Revenue Recovery OS

Revenue Recovery OS is the current Featured Build and strongest overall systems project in the portfolio.

Positioning:

An explainable customer churn-risk and recovery operations system connecting customer signals, human-approved interventions, automation, and confirmed outcomes.

Core operational flow:

Customer Events
→ Deterministic Risk Signals
→ Explainable Risk Score
→ Revenue Exposure
→ Recovery Recommendation
→ Human Approval
→ n8n Execution
→ Callback
→ Confirmed Outcome
→ Analytics

Important architecture:
- React and TypeScript provide the operator-facing application.
- A Cloudflare Worker owns API validation, business logic, and lifecycle control.
- Supabase / PostgreSQL stores operational business records.
- Churn-risk scoring is deterministic and rule-based.
- AI is advisory and does not calculate the authoritative churn-risk score.
- AI can assist summaries, recommendations, and communication drafting.
- Human approval remains required for consequential intervention decisions.
- n8n performs approved external automation work.
- Business state remains owned by the application and database rather than by n8n.
- Technical execution success and actual customer-recovery outcome are separate states.
- Callbacks record execution results.
- Confirmed business outcomes are recorded separately as recovered or not recovered.
- Failed execution remains observable rather than silently disappearing.
- The public demo uses fictional and sanitized data.
- Consequential mutation paths are intentionally restricted in the public demo.
- The public system demonstrates architecture and workflow behavior without claiming real customers or recovered revenue.

Public deployment architecture:

Visitor
→ Vercel React / TypeScript frontend
→ Cloudflare Worker API
→ Demo Supabase / PostgreSQL

Automation execution architecture:

Application
→ approved intervention
→ n8n
→ external action
→ callback
→ application/database state

Best evidence:
- full-stack React and TypeScript development
- Cloudflare Worker backend ownership
- PostgreSQL / Supabase operational state
- deterministic business logic
- explainable risk scoring
- human-in-the-loop workflows
- n8n integration
- automation boundaries
- failure-state handling
- outcome tracking
- AI used as assistance rather than business authority
- public-demo security boundaries

Evidence boundary:

Do not claim:
- real customers
- measured real-world revenue recovery
- commercial production deployment
- predictive machine-learning churn probability
- enterprise readiness

# Personal Developer Portfolio and M

The portfolio includes M, a custom AI portfolio assistant.

Current request architecture:

Portfolio React frontend
→ Cloudflare Worker API
→ deterministic validation and policy guards
→ Cloudflare Workers AI
→ complete upstream response buffering
→ outbound security inspection
→ SSE-formatted response to the interface

Important Worker behavior:
- The React frontend sends recent conversation context to the Cloudflare Worker.
- The Worker owns system instructions and approved knowledge.
- Visitors cannot submit a system role.
- Request body size, message count, message length, message role, and content types are validated.
- CORS uses an explicit allowlist.
- Per-client and global rate limiting protect the endpoint.
- Prompt-extraction and role-override attempts are checked before inference.
- Full portfolio-cloning and source-reconstruction requests use a separate deterministic guard.
- A deterministic portfolio-scope gate prevents M from turning into a general-purpose assistant.
- Scope checking happens before response-mode selection and model inference.
- Malicious or unsafe conversation history can be removed before being sent back to the model.
- Large generated code responses can be removed from future history.
- The Worker requests a streamed Workers AI response internally, but does not directly expose those upstream tokens.
- The complete model answer is buffered first.
- The buffered answer is inspected for signs of internal prompt leakage.
- Only validated text is returned to the frontend using the existing SSE response format.
- This intentionally prioritizes confidentiality checks over true token-by-token browser streaming.

Important distinction:

The SSE interface remains useful for frontend compatibility, but current production behavior validates the complete answer before sending it to the visitor.

Security is layered rather than relying only on model instructions.

Best evidence:
- React / TypeScript frontend
- Cloudflare Workers
- Workers AI integration
- request validation
- deterministic scope enforcement
- prompt-injection defenses
- source-reconstruction boundaries
- conversation sanitization
- outbound model-response inspection
- CORS
- rate limiting
- frontend/backend separation
- API hardening

# NovaTech Solutions

NovaTech Solutions is a fictional frontend and business-presentation project.

Important context:
- The project practices a complete marketing-page structure rather than only a hero section.
- The layout is responsive and organized around a clear conversion path.
- The page includes service positioning, process explanation, pricing comparison, FAQs, testimonials, and contact interaction.
- Testimonials, pricing, companies, and business claims belong to the fictional exercise.
- They are not evidence of real customers or commercial results.
- The contact experience is frontend-focused and does not represent a production sales system.

Best evidence:
- responsive frontend fundamentals
- business-oriented web presentation
- conversion-focused page structure
- interaction design

# Offangle

Offangle is a fictional Valorant coaching landing-page project.

Important context:
- It demonstrates responsive frontend design.
- It uses a gaming-specific visual direction.
- The layout focuses on strong hero positioning and a clear conversion path.
- It is supporting frontend evidence rather than one of Mj's primary automation systems.

Best evidence:
- responsive HTML, CSS, and JavaScript
- visual hierarchy
- focused landing-page structure
- frontend presentation

# Workflow Operations Manager

Important architecture:
- Projects and nested tasks form the primary data model.
- Project progress, task totals, overdue state, dashboard values, calendar entries, and reports are derived from shared underlying data.
- CRUD operations update shared application state and dependent views.
- Search, filtering, and sorting operate on display copies rather than mutating source data.
- Local Storage persists application data and preferences.
- The application uses modular JavaScript rather than one large script.
- Calendar and reporting views are projections of operational data rather than separate datastores.
- Keyboard workflows include guarded shortcuts so normal text input is not hijacked.

Best evidence:
- JavaScript application architecture
- shared application state
- CRUD logic
- derived state
- DOM-driven interfaces
- local persistence
- modular frontend organization

This project is more focused on frontend application logic than workflow automation.

# Invoice Collections Automation

Core flow:

Invoice Event
→ Normalization
→ Validation
→ Duplicate Prevention
→ Collection Scoring
→ Priority Assignment
→ Persistence
→ Routing
→ Notifications
→ HTTP Delivery
→ Success / Failure Detection
→ Bounded Retry
→ Final Failure Handling
→ Technical Error Logging

Important architecture:
- Incoming invoice data is normalized and validated before downstream business logic.
- Invalid business input is separated from accepted invoice records.
- Existing invoice IDs are checked before side effects to reduce duplicate processing.
- Valid invoices receive a deterministic collection score based on business fields such as amount, account tier, and payment terms.
- Scores determine LOW, MEDIUM, or HIGH collection priority.
- Priority affects finance routing and notification behavior.
- Accepted invoice data is persisted before external HTTP delivery.
- Persistence and delivery are separate concerns.
- A downstream outage does not erase an already accepted invoice.
- Temporary HTTP failures can enter a bounded retry path.
- Retry behavior includes eligibility checks, delay, success exit, retry counting, and a hard limit.
- Non-retryable failures and exhausted retries enter final failure handling.
- Technical and integration failures are logged separately from invalid business input.

Best evidence:
- workflow validation
- deterministic business rules
- idempotency
- priority routing
- persistence
- bounded retries
- failure handling
- APIs
- Google Sheets
- Gmail
- webhook integration

# AI Support Operations Triage System

Core flow:

Classify
→ Validate
→ Review
→ Route
→ Draft

Important architecture:
- Customer messages are treated as untrusted input.
- AI interprets language but does not own consequential workflow decisions.
- Classification produces structured fields such as category, summary, requested action, urgency, and interpretation-level review state.
- Structured AI output is validated using deterministic logic.
- Invalid or malformed model output enters a separate failure/fallback path.
- AI uncertainty and business-required human review are separate concepts.
- Deterministic review rules can require human review even when the classifier considers a request clear.
- Sensitive business policy remains outside the prompt when deterministic rules provide stronger control.
- Valid tickets are routed to an appropriate operational queue.
- Draft replies use processed ticket context but cannot claim unverified actions.
- Drafting rules prevent invented refunds, investigations, fixes, escalations, prices, policies, timelines, or internal routing details.
- Prompt-injection and adversarial ticket cases are included in evaluation.
- Fixed benchmark testing compares model behavior against documented expected outcomes.

Best evidence:
- AI-assisted automation
- structured model output
- deterministic validation
- hybrid AI and rules architecture
- human-review policy
- defensive handling of untrusted text
- evaluation
- failure-path thinking

# Project Selection Guide

If a visitor asks which project to inspect first:

Strongest overall systems / full-stack project:
Revenue Recovery OS

n8n automation and workflow reliability:
Invoice Collections Automation

AI-assisted automation with deterministic controls:
AI Support Operations Triage System

JavaScript application architecture:
Workflow Operations Manager

Frontend and landing-page work:
NovaTech Solutions or Offangle

Modern web plus AI integration:
M / Personal Developer Portfolio

# Evidence Boundaries

Prefer evidence-based descriptions.

Good:

"He's used n8n in workflows involving validation, routing, retries, and integrations."

Avoid:

"He's an expert n8n engineer."

Good:

"Revenue Recovery OS is his strongest systems project so far."

Avoid:

"It's an enterprise-ready revenue platform."

Good:

"His projects show growing systems thinking."

Avoid:

"He has years of professional systems-engineering experience."

When discussing:
- benchmark results
- fictional projects
- portfolio-scale systems
- prototypes
- demo deployments

preserve those boundaries instead of presenting them as real client or production outcomes.
