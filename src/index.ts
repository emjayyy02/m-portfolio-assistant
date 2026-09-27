/**
 * Portfolio assistant using Cloudflare Workers AI.
 *
 * @license MIT
 */

// M Portfolio Assistant V1

import { Env, ChatMessage } from "./types";
import {
	PROMPT_REFUSAL,
	SOURCE_CLONE_REFUSAL,
	isLargeGeneratedCodeResponse,
	isPortfolioCloneRequest,
	looksLikeInternalPromptLeak,
	looksLikePromptInjection,
	readCompleteModelResponse,
} from "./security";

import assistantRules from "../docs/assistant-rules.md";
import portfolioGenerated from "../docs/portfolio-generated.md";
import portfolioDeepContext from "../docs/portfolio-deep-context.md";

// --------------------------------------------------
// CONFIGURATION
// --------------------------------------------------

const MODEL_ID = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

const MAX_BODY_SIZE = 12_000;
const MAX_MESSAGES = 10;
const MAX_MESSAGE_LENGTH = 750;

const ALLOWED_ORIGINS = [
	"https://marvinsilverio.vercel.app",
	"http://localhost:5173",
	"http://127.0.0.1:5173",
];

type ResponseMode =
	| "normal"
	| "comparison"
	| "detailed"
	| "technical";

// --------------------------------------------------
// MAIN WORKER
// --------------------------------------------------

export default {
	async fetch(
		request: Request,
		env: Env,
		_ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// Static frontend bundled with the Worker template.
		if (
			url.pathname === "/" ||
			!url.pathname.startsWith("/api/")
		) {
			return env.ASSETS.fetch(request);
		}

		if (url.pathname !== "/api/chat") {
			return new Response("Not found", {
				status: 404,
			});
		}

		if (request.method === "OPTIONS") {
			if (!isOriginAllowed(request)) {
				return new Response(null, {
					status: 403,
				});
			}

			return new Response(null, {
				status: 204,
				headers: getCorsHeaders(request),
			});
		}

		if (request.method !== "POST") {
			return new Response("Method not allowed", {
				status: 405,
				headers: getCorsHeaders(request),
			});
		}

		if (!isOriginAllowed(request)) {
			return jsonError(
				"Origin not allowed.",
				403,
				request,
			);
		}

		return handleChatRequest(request, env);
	},
} satisfies ExportedHandler<Env>;

// --------------------------------------------------
// CHAT REQUEST HANDLER
// --------------------------------------------------

async function handleChatRequest(
	request: Request,
	env: Env,
): Promise<Response> {
	const contentType =
		request.headers.get("Content-Type") ?? "";

	if (
		!contentType
			.toLowerCase()
			.startsWith("application/json")
	) {
		return jsonError(
			"Content-Type must be application/json.",
			415,
			request,
		);
	}

	try {
		let rawBody: string;

		try {
			rawBody = await request.text();
		} catch {
			return jsonError(
				"Unable to read request body.",
				400,
				request,
			);
		}

		const bodySize =
			new TextEncoder().encode(rawBody).length;

		if (bodySize > MAX_BODY_SIZE) {
			return jsonError(
				`Request body cannot exceed ${MAX_BODY_SIZE} bytes.`,
				413,
				request,
			);
		}

		let body: unknown;

		try {
			body = JSON.parse(rawBody);
		} catch {
			return jsonError(
				"Request body must contain valid JSON.",
				400,
				request,
			);
		}

		if (
			typeof body !== "object" ||
			body === null ||
			!("messages" in body)
		) {
			return jsonError(
				"Request body must contain a messages array.",
				400,
				request,
			);
		}

		const { messages } = body as {
			messages: unknown;
		};

		if (!Array.isArray(messages)) {
			return jsonError(
				"messages must be an array.",
				400,
				request,
			);
		}

		if (messages.length === 0) {
			return jsonError(
				"messages cannot be empty.",
				400,
				request,
			);
		}

		if (messages.length > MAX_MESSAGES) {
			return jsonError(
				`Conversation cannot exceed ${MAX_MESSAGES} messages.`,
				400,
				request,
			);
		}

		const safeMessages: ChatMessage[] = [];

		for (const message of messages) {
			if (
				typeof message !== "object" ||
				message === null
			) {
				return jsonError(
					"Each message must be an object.",
					400,
					request,
				);
			}

			const { role, content } = message as {
				role?: unknown;
				content?: unknown;
			};

			// The client never owns the system role.
			if (
				role !== "user" &&
				role !== "assistant"
			) {
				return jsonError(
					"Message role must be user or assistant.",
					400,
					request,
				);
			}

			if (typeof content !== "string") {
				return jsonError(
					"Message content must be a string.",
					400,
					request,
				);
			}

			const trimmedContent = content.trim();

			if (trimmedContent.length === 0) {
				return jsonError(
					"Message content cannot be empty.",
					400,
					request,
				);
			}

			if (
				trimmedContent.length >
				MAX_MESSAGE_LENGTH
			) {
				return jsonError(
					`Each message cannot exceed ${MAX_MESSAGE_LENGTH} characters.`,
					400,
					request,
				);
			}

			safeMessages.push({
				role,
				content: trimmedContent,
			});
		}

		// Only structurally valid requests consume rate-limit quota.
		const rateLimitResponse =
			await checkChatRateLimit(request, env);

		if (rateLimitResponse) {
			return rateLimitResponse;
		}

		const latestUserMessage =
			[...safeMessages]
				.reverse()
				.find(
					(message) =>
						message.role === "user",
				)
				?.content ?? "";

		// Text such as "SYSTEM: ..." is still a user message.
		// Block obvious role/prompt-injection attempts before inference.
		if (looksLikePromptInjection(latestUserMessage)) {
			return createSseTextResponse(
				PROMPT_REFUSAL,
				request,
			);
		}

		if (isPortfolioCloneRequest(latestUserMessage)) {
			return createSseTextResponse(
				SOURCE_CLONE_REFUSAL,
				request,
			);
		}

		const modelConversation =
			sanitizeConversationForModel(
				safeMessages,
			);

		const responseMode =
			getResponseMode(latestUserMessage);

		const responseContract =
			getResponseContract(responseMode);

		const maxTokens =
			getMaxResponseTokens(responseMode);

		const systemPrompt = `
${assistantRules}

# CURRENT RESPONSE CONTRACT
${responseContract}

# CURRENT PUBLIC PORTFOLIO FACTS
${portfolioGenerated}

# DEEPER APPROVED PORTFOLIO CONTEXT
${portfolioDeepContext}

# FINAL RESPONSE REMINDER
The CURRENT RESPONSE CONTRACT is mandatory for this reply.
Do not exceed its sentence, bullet, step, or word limits.
Stop immediately when the contract is satisfied.
`;

		const modelMessages: ChatMessage[] = [
			{
				role: "system",
				content: systemPrompt,
			},
			...modelConversation,
		];

		const inputs = {
			messages: modelMessages,
			max_tokens: maxTokens,
			stream: true,
			temperature: 0.2,
			top_p: 0.8,
			repetition_penalty: 1.08,
		} satisfies AiTextGenerationInput & {
			stream: true;
		};

		const stream =
			await env.AI.run<typeof MODEL_ID>(
				MODEL_ID,
				inputs,
			);

		const generatedText =
			await readCompleteModelResponse(stream);

		if (looksLikeInternalPromptLeak(generatedText)) {
			console.warn(
				"[security] Blocked potential prompt leakage.",
			);
			return createSseTextResponse(
				PROMPT_REFUSAL,
				request,
			);
		}

		return createSseTextResponse(generatedText, request);
	} catch (error) {
		console.error(
			"Error processing chat request:",
			error,
		);

		return jsonError(
			"Failed to process request.",
			500,
			request,
		);
	}
}

// --------------------------------------------------
// RESPONSE MODE + CONTRACT
// --------------------------------------------------

function getResponseMode(
	message: string,
): ResponseMode {
	const technicalRequest =
		/\b(code|example|json|payload|schema|request body|api request|response body|typescript|javascript|html|css|curl|fetch|webhook payload)\b/i
			.test(message);

	if (technicalRequest) {
		return "technical";
	}

	const comparisonRequest =
		/\b(compare|comparison|difference|different|versus|vs\.?)\b/i
			.test(message);

	if (comparisonRequest) {
		return "comparison";
	}

	const detailedRequest =
		/\b(detail|detailed|breakdown|architecture|step[- ]?by[- ]?step|how does|how did|how is|how was|how it works|technical explanation|technical depth|explain in depth|deep dive)\b/i
			.test(message);

	if (detailedRequest) {
		return "detailed";
	}

	return "normal";
}

function getResponseContract(
	mode: ResponseMode,
): string {
	switch (mode) {
		case "comparison":
			return `
This is a COMPARISON response.

STRICT OUTPUT SHAPE:
- Output exactly 2 bullet points.
- Each bullet must contain exactly 1 sentence.
- Maximum 75 words total across both bullets.
- First bullet: the first project or option and its main focus.
- Second bullet: the second project or option and its main focus or key contrast.
- No introduction.
- No third bullet.
- No conclusion.
- Do not list every feature.
- Stop after bullet 2.
`;

		case "detailed":
			return `
This is a DETAILED response, but detailed means compact architecture, not exhaustive documentation.

STRICT OUTPUT SHAPE:
- Output exactly 5 bullet points.
- Each bullet must contain exactly 1 sentence.
- Maximum 120 words total.
- Choose only the 5 most important stages or ideas.
- Combine closely related stages.
- Use a short bold stage label followed by one sentence.
- No introduction.
- No sub-bullets.
- No paragraph after the bullets.
- Do not explain every node, field, feature, or tool.
- Stop immediately after bullet 5.
`;

		case "technical":
			return `
This is a CODE / JSON / TECHNICAL EXAMPLE response.

STRICT OUTPUT SHAPE:
- Start with at most 1 short sentence of context.
- Then provide exactly 1 relevant code or JSON block.
- After the code block, use at most 1 short sentence if clarification is necessary.
- Do not add extra sections, background, or unrelated implementation detail.
- Keep the example minimal but valid.
- Stop after the example and optional clarification sentence.
`;

		case "normal":
		default:
			return `
This is a NORMAL portfolio response.

STRICT OUTPUT SHAPE:
- Maximum 2 sentences.
- Maximum 45 words total.
- Prefer 1 sentence when it fully answers the question.
- No headings.
- No bullet list unless the visitor explicitly requested a list.
- No introduction or repeated conclusion.
- Mention only facts necessary to answer the question.
- Stop immediately when the answer is complete.
`;
	}
}

function getMaxResponseTokens(
	mode: ResponseMode,
): number {
	// These are safety ceilings, not target lengths.
	// The response contract controls brevity so the model has room
	// to finish naturally instead of being chopped mid-sentence.
	switch (mode) {
		case "comparison":
			return 256;
		case "detailed":
			return 512;
		case "technical":
			return 640;
		case "normal":
		default:
			return 256;
	}
}

// --------------------------------------------------
// CONVERSATION SANITIZATION
// --------------------------------------------------

function sanitizeConversationForModel(
	messages: readonly ChatMessage[],
): ChatMessage[] {
	const sanitized: ChatMessage[] = [];
	let skipFollowingAssistant = false;

	for (const message of messages) {
		if (
			message.role === "user" &&
			looksLikePromptInjection(
				message.content,
			)
		) {
			skipFollowingAssistant = true;
			continue;
		}

		// Do not reuse old source-reconstruction requests as context for a
		// later answer, even though they are not prompt-injection attempts.
		if (
			message.role === "user" &&
			isPortfolioCloneRequest(message.content)
		) {
			continue;
		}

		if (
			skipFollowingAssistant &&
			message.role === "assistant"
		) {
			skipFollowingAssistant = false;
			continue;
		}

		if (message.role === "user") {
			skipFollowingAssistant = false;
		}

		// Keep history useful without letting one old verbose answer
		// dominate the current prompt.
		if (message.role === "assistant") {
			if (
				looksLikeInternalPromptLeak(message.content) ||
				isLargeGeneratedCodeResponse(message.content)
			) {
				continue;
			}

			sanitized.push({
				role: "assistant",
				content: message.content.slice(0, 600),
			});
			continue;
		}

		sanitized.push(message);
	}

	return sanitized;
}

// --------------------------------------------------
// DETERMINISTIC SSE RESPONSE
// --------------------------------------------------

function createSseTextResponse(
	text: string,
	request: Request,
): Response {
	const body =
		`data: ${JSON.stringify({
			response: text,
		})}\n\n` +
		"data: [DONE]\n\n";

	return new Response(body, {
		status: 200,
		headers: {
			"content-type":
				"text/event-stream; charset=utf-8",
			"cache-control": "no-cache",
			connection: "keep-alive",
			...getCorsHeaders(request),
		},
	});
}

// --------------------------------------------------
// RATE LIMITING
// --------------------------------------------------

async function checkChatRateLimit(
	request: Request,
	env: Env,
): Promise<Response | null> {
	const clientIp =
		request.headers.get(
			"CF-Connecting-IP",
		) ?? "local-development";

	const clientResult =
		await env.CHAT_CLIENT_RATE_LIMITER.limit({
			key: `chat-client:${clientIp}`,
		});

	if (!clientResult.success) {
		return jsonError(
			"Too many requests. Please wait a moment and try again.",
			429,
			request,
		);
	}

	const globalResult =
		await env.CHAT_GLOBAL_RATE_LIMITER.limit({
			key: "portfolio-chat",
		});

	if (!globalResult.success) {
		return jsonError(
			"M is a little busy right now. Please try again shortly.",
			429,
			request,
		);
	}

	return null;
}

// --------------------------------------------------
// JSON ERROR HELPER
// --------------------------------------------------

function jsonError(
	message: string,
	status: number,
	request?: Request,
): Response {
	return new Response(
		JSON.stringify({
			error: message,
		}),
		{
			status,
			headers: {
				"content-type":
					"application/json",
				...(request
					? getCorsHeaders(request)
					: {}),
			},
		},
	);
}

// --------------------------------------------------
// CORS
// --------------------------------------------------

function getCorsHeaders(
	request: Request,
): Record<string, string> {
	const origin =
		request.headers.get("Origin");

	if (!origin) {
		return {};
	}

	const workerOrigin =
		new URL(request.url).origin;

	const allowed =
		origin === workerOrigin ||
		ALLOWED_ORIGINS.includes(origin);

	if (!allowed) {
		return {};
	}

	return {
		"Access-Control-Allow-Origin": origin,
		"Access-Control-Allow-Methods":
			"POST, OPTIONS",
		"Access-Control-Allow-Headers":
			"Content-Type",
		Vary: "Origin",
	};
}

function isOriginAllowed(
	request: Request,
): boolean {
	const origin =
		request.headers.get("Origin");

	// Requests without Origin may be curl, API tools,
	// or server-to-server requests. CORS is a browser boundary.
	if (!origin) {
		return true;
	}

	const workerOrigin =
		new URL(request.url).origin;

	return (
		origin === workerOrigin ||
		ALLOWED_ORIGINS.includes(origin)
	);
}
