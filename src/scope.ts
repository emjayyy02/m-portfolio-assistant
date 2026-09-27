import type { ChatMessage } from "./types";

export const OUT_OF_SCOPE_RESPONSE =
	"I'm only here for Mj and his portfolio 😅. Ask me about his projects, skills, experience, education, or how his systems were built.";

function normalize(value: string): string {
	return value
		.normalize("NFKC")
		.toLowerCase()
		.replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
		.replace(/[’‘]/g, "'")
		.replace(/[“”]/g, '"')
		.replace(/\s+/g, " ")
		.trim();
}

const MARVIN_REFERENCE =
	/\b(?:marvin(?:\s+silverio)?(?:'s|s)?|mj(?:'s)?)\b/;

const PUBLIC_PROFILE_TOPIC =
	/\b(?:age|old|email|e-mail|contact|contact info|contact information|linkedin|instagram|github|website|portfolio|portfolio link|site|resume|cv|study|studies|studying|student|school|college|university|course|degree|education|location|located|based|from|role|career|job|professional direction|professional goals?|goals?|focus|learning|experience|background|certifications?|skills?|technologies|tech stack|work|projects?)\b/;

const PRONOUN_PROFILE_TOPIC =
	/\b(?:age|old|email|e-mail|contact|linkedin|instagram|github|website|portfolio|resume|cv|study|studies|studying|student|school|college|university|course|degree|education|from|location|located|based|built|build|projects?|skills?|technologies|tech stack|know|knows|used|use|work|worked|works|experience|background|strengths?|developing|career|role|fit|automation|api|apis|webhook|webhooks|backend|frontend|failure cases|certifications?|professional|goals?|focus|learning)\b/;

const SHORT_PROFILE_REQUEST =
	/^(?:email|e-mail|linkedin|instagram|github|github account|portfolio|portfolio link|website|site|resume|cv|school|college|university|course|degree|education|age|location|contact|contact info|contact information)\??$/;

/**
 * Only approved names — never technology/capability headings by themselves —
 * confer direct portfolio scope.
 */
export function extractPortfolioKnowledgeTerms(
	knowledge: string,
): string[] {
	const terms = new Set<string>();
	let section = "";

	for (const line of knowledge.split(/\r?\n/)) {
		const sectionMatch =
			/^##\s+(.+?)\s*$/.exec(line);

		if (sectionMatch) {
			section = normalize(sectionMatch[1]);
			continue;
		}

		if (
			!/^(projects|certifications|education)$/.test(
				section,
			)
		) {
			continue;
		}

		const heading =
			/^###\s+(.+?)\s*$/.exec(line);

		const namedField =
			section === "certifications"
				? /^Provider:\s*(.+?)\s*$/.exec(line)
				: section === "education"
					? /^Institution:\s*(.+?)\s*$/.exec(
							line,
						)
					: null;

		const name =
			heading?.[1] ?? namedField?.[1];

		if (name && name.length >= 4) {
			terms.add(normalize(name));
		}
	}

	return [...terms];
}

function containsTermAtBoundary(
	message: string,
	term: string,
): boolean {
	const index = message.indexOf(term);

	if (index < 0) {
		return false;
	}

	const before =
		message[index - 1] ?? " ";

	const after =
		message[index + term.length] ?? " ";

	return (
		!/\p{L}|\p{N}/u.test(before) &&
		!/\p{L}|\p{N}/u.test(after)
	);
}

function mentionsKnownEntity(
	message: string,
	knowledge: string,
): boolean {
	return extractPortfolioKnowledgeTerms(
		knowledge,
	).some((term) =>
		containsTermAtBoundary(message, term),
	);
}

/**
 * A Marvin mention must not be usable as a prefix that unlocks an unrelated task.
 *
 * Example:
 * "Marvin, write me a Python game."
 */
function hasIndependentGeneralTask(
	message: string,
): boolean {
	return (
		/\b(?:write|create|make|build|fix|debug|teach|solve|calculate|generate)\s+(?:(?:me|my|a|an|some|the|this|for me)\s+){0,3}(?:java|python|react|javascript|typescript|html|css|sql|code|script|component|app|website|calculator|game|essay|poem|story|email|equation|assignment|quiz)\b/.test(
			message,
		) ||
		/\b(?:what's|what is|tell me)\s+(?:the\s+)?(?:weather|capital of|score of|latest news)\b/.test(
			message,
		) ||
		/\b(?:tell me a joke|give me relationship advice|explain (?:photosynthesis|quantum physics|world war)|who (?:is|was|invented))\b/.test(
			message,
		)
	);
}

function isDirectlyScoped(
	message: string,
	knowledge: string,
): boolean {
	if (hasIndependentGeneralTask(message)) {
		return false;
	}

	/*
	 * Explicit Marvin / Mj reference.
	 *
	 * This intentionally permits unknown Marvin-related questions to reach
	 * the model, where the factual-accuracy rules can answer "I don't have
	 * that information" instead of incorrectly calling them unrelated.
	 */
	if (MARVIN_REFERENCE.test(message)) {
		return true;
	}

	if (
		mentionsKnownEntity(
			message,
			knowledge,
		)
	) {
		return true;
	}

	/*
	 * Natural phrases about the current portfolio.
	 */
	if (
		/\b(?:this|his|marvin's|marvins|mj's)\s+(?:portfolio|website|site|projects?|skills?|work|experience|background|education|certifications?|resume|career|professional direction|tech stack|strongest project|automation|github|linkedin|instagram|email)\b/.test(
			message,
		)
	) {
		return true;
	}

	if (
		/\bportfolio\s+(?:website|site|assistant|project|knowledge|link)\b/.test(
			message,
		)
	) {
		return true;
	}

	/*
	 * Questions specifically about M.
	 */
	if (
		/\b(?:what is m|who is m|how (?:was|is|does) m|what model does m|why does m|m's (?:architecture|model|security|portfolio|scope))\b/.test(
			message,
		)
	) {
		return true;
	}

	if (
		/\b(?:this|the)\s+(?:portfolio\s+)?assistant\b/.test(
			message,
		)
	) {
		return true;
	}

	/*
	 * Pronouns naturally refer to Marvin inside a dedicated portfolio
	 * assistant when paired with an approved public/professional topic.
	 */
	if (
		/\b(?:he|him|his)\b/.test(message) &&
		PRONOUN_PROFILE_TOPIC.test(message)
	) {
		return true;
	}

	/*
	 * Common short requests inside a dedicated portfolio assistant.
	 *
	 * "github"
	 * "email?"
	 * "linkedin"
	 * "portfolio link"
	 *
	 * These are much more likely to mean Marvin's public profile than a
	 * request for general knowledge.
	 */
	if (SHORT_PROFILE_REQUEST.test(message)) {
		return true;
	}

	if (
		/\b(?:what|which)\s+project\s+should\s+(?:i|a recruiter|a client)\s+(?:inspect|look at|review|start with)\b/.test(
			message,
		)
	) {
		return true;
	}

	/*
	 * Questions phrased around an implied Marvin profile.
	 */
	if (
		/\b(?:where|what)\s+(?:does|is)\s+(?:he|mj)\s+(?:study|studying|based|located|work)\b/.test(
			message,
		)
	) {
		return true;
	}

	if (
		/\bwhat\s+(?:course|degree|program)\s+is\s+he\s+(?:taking|studying|in)\b/.test(
			message,
		)
	) {
		return true;
	}

	return false;
}

const CONTINUATION = [
	/^(?:why|how)\??$/,

	/^(?:and\s+)?what about\s+(?:(?:the|that|this)\s+)?(?:first one|second one|other one|project|workflow|system|automation|frontend|backend|ai part|architecture|security|validation|testing|deployment)\??$/,

	/^(?:and\s+)?the\s+(?:frontend|backend|ai part|architecture|security)\??$/,

	/^tell me more(?: about (?:it|that|this|the project))?\??$/,

	/^go deeper(?: on (?:it|that|this))?\??$/,

	/^can you explain (?:that|it|this)\??$/,

	/^what was the hardest part\??$/,

	/^which one\b.{0,80}\?$/,

	/^(?:does|did|was|is|what|which|how)\b.{0,100}\b(?:it|that|this|he|him|his|the (?:project|first one|second one|other one|workflow|system|automation|frontend|backend|ai part|architecture))\b.{0,80}\??$/,

	/^(?:email|e-mail|linkedin|instagram|github|github account|portfolio|portfolio link|website|resume|cv|school|college|course|degree|education|age|location|contact)\??$/,
];

function isContinuation(
	message: string,
): boolean {
	return CONTINUATION.some(
		(pattern) => pattern.test(message),
	);
}

function hasRecentPortfolioExchange(
	history: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const previous =
		history[history.length - 1];

	if (
		previous?.role !== "assistant" ||
		!previous.content.trim() ||
		previous.content ===
			OUT_OF_SCOPE_RESPONSE
	) {
		return false;
	}

	/*
	 * Walk the short client-provided history in sequence.
	 *
	 * A continuation is valid only when it chains from an actual
	 * portfolio-scoped exchange.
	 */
	let scoped = false;

	for (
		let index = 0;
		index < history.length - 1;
		index++
	) {
		const current = history[index];

		if (current.role !== "user") {
			continue;
		}

		const next =
			history[index + 1];

		if (
			next?.role !== "assistant" ||
			next.content ===
				OUT_OF_SCOPE_RESPONSE
		) {
			scoped = false;
			continue;
		}

		const text =
			normalize(current.content);

		scoped =
			isDirectlyScoped(
				text,
				knowledge,
			) ||
			(
				scoped &&
				isContinuation(text) &&
				!hasIndependentGeneralTask(
					text,
				)
			);
	}

	return scoped;
}

export function isPortfolioFollowUp(
	latestMessage: string,
	conversationHistory:
		readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message =
		normalize(latestMessage);

	return (
		!hasIndependentGeneralTask(
			message,
		) &&
		isContinuation(message) &&
		hasRecentPortfolioExchange(
			conversationHistory,
			knowledge,
		)
	);
}

export function isPortfolioScopedRequest(
	latestMessage: string,
	conversationHistory:
		readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message =
		normalize(latestMessage);

	return (
		isDirectlyScoped(
			message,
			knowledge,
		) ||
		isPortfolioFollowUp(
			message,
			conversationHistory,
			knowledge,
		)
	);
}
