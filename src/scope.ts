import type { ChatMessage } from "./types";

export const OUT_OF_SCOPE_RESPONSE =
	"I'm only here for Mj and his portfolio 😅. Ask me about his projects, skills, experience, education, or how his systems were built.";

function normalize(value: string): string {
	return value
		.normalize("NFKC")
		.toLowerCase()
		.replace(/[\u200b-\u200d\u2060\ufeff]/g, "")
		.replace(/[’‘]/g, "'")
		.replace(/\s+/g, " ")
		.trim();
}

/**
 * Explicit references to Marvin.
 *
 * Supports:
 * marvin
 * marvin silverio
 * marvin's
 * marvins
 * mj
 * mj's
 */
const MARVIN_REFERENCE =
	/\b(?:marvin(?: silverio)?(?:'s|s)?|mj(?:'s|s)?)\b/;

/**
 * Public / professional topics that make he/him/his clearly refer
 * to Marvin in the context of his portfolio assistant.
 */
const PRONOUN_PROFILE_TOPIC =
	/\b(?:age|old|email|contact|linkedin|linked in|instagram|github|website|portfolio|resume|cv|study|studies|studying|student|school|college|university|course|degree|program|education|from|location|based|built|build|projects?|skills?|technologies|tech stack|know|knows|used|use|work|worked|works|experience|background|strengths?|developing|career|role|fit|automation|api|apis|webhooks?|backend|frontend|failure cases|certifications?|professional|goals?|focus|learning)\b/;

/**
 * Inside a portfolio assistant, these very short requests can
 * reasonably mean Marvin's public profile.
 */
const SHORT_PROFILE_REQUEST =
	/^(?:email|linkedin|linked in|instagram|github|github account|portfolio|portfolio link|website|site|resume|cv|school|college|university|course|degree|program|education|age|location|contact|contact info|contact information)\??$/;

/**
 * Only approved named entities confer scope.
 *
 * Technology headings such as React or JavaScript intentionally do not.
 */
export function extractPortfolioKnowledgeTerms(
	knowledge: string,
): string[] {
	const terms = new Set<string>();
	let section = "";

	for (const line of knowledge.split(/\r?\n/)) {
		const sectionMatch = /^##\s+(.+?)\s*$/.exec(line);

		if (sectionMatch) {
			section = normalize(sectionMatch[1]);
			continue;
		}

		if (!/^(projects|certifications|education)$/.test(section)) {
			continue;
		}

		const heading = /^###\s+(.+?)\s*$/.exec(line);

		const namedField =
			section === "certifications"
				? /^Provider:\s*(.+?)\s*$/.exec(line)
				: section === "education"
					? /^Institution:\s*(.+?)\s*$/.exec(line)
					: null;

		const name = heading?.[1] ?? namedField?.[1];

		if (name && name.length >= 4) {
			terms.add(normalize(name));
		}
	}

	return [...terms];
}

function mentionsKnownEntity(
	message: string,
	knowledge: string,
): boolean {
	return extractPortfolioKnowledgeTerms(knowledge).some((term) => {
		const index = message.indexOf(term);

		if (index < 0) return false;

		const before = message[index - 1] ?? " ";
		const after = message[index + term.length] ?? " ";

		return (
			!/[\p{L}\p{N}]/u.test(before) &&
			!/[\p{L}\p{N}]/u.test(after)
		);
	});
}

/**
 * Prevent one Marvin reference from unlocking an unrelated general task.
 *
 * Example:
 * "Marvin, write me a Python snake game."
 */
function hasIndependentGeneralTask(message: string): boolean {
	return (
		/\b(?:write|create|make|build|fix|debug|teach|solve|calculate|generate)\s+(?:(?:me|my|a|an|some|the|this|for me)\s+){0,3}(?:java|python|react|javascript|typescript|html|css|sql|code|script|component|app|website|calculator|game|essay|poem|story|email|equation|assignment|quiz)\b/.test(
			message,
		) ||
		/\b(?:what's|what is|tell me)\s+(?:the\s+)?(?:weather|capital of|score of|latest news)\b/.test(
			message,
		) ||
		/\b(?:tell me a joke|give me relationship advice|explain (?:photosynthesis|quantum physics|world war))\b/.test(
			message,
		)
	);
}

function isDirectlyScoped(
	message: string,
	knowledge: string,
): boolean {
	/*
	 * Explicit unrelated tasks win even when Marvin is mentioned.
	 */
	if (hasIndependentGeneralTask(message)) {
		return false;
	}

	/*
	 * Any explicit question about Marvin / Mj belongs to portfolio scope.
	 *
	 * Whether the requested fact is KNOWN is handled later by M's
	 * approved knowledge and factual-accuracy rules.
	 */
	if (MARVIN_REFERENCE.test(message)) {
		return true;
	}

	/*
	 * Exact known project, certification, or education entities.
	 */
	if (mentionsKnownEntity(message, knowledge)) {
		return true;
	}

	/*
	 * Natural portfolio wording.
	 */
	if (
		/\b(?:this|his)\s+(?:portfolio|website|site|projects?|skills?|work|experience|background|education|certifications?|resume|career|professional direction|tech stack|strongest project|automation)\b/.test(
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
		/\b(?:who is m|what is m|how (?:was|is|does) m|what model does m|why does m|m's (?:architecture|model|security|portfolio|scope))\b/.test(
			message,
		)
	) {
		return true;
	}

	if (
		/\b(?:this|the)\s+(?:portfolio\s+)?assistant\b/.test(message)
	) {
		return true;
	}

	/*
	 * Natural pronoun questions.
	 *
	 * "where is he studying?"
	 * "what is his github?"
	 * "does he know react?"
	 */
	if (
		/\b(?:he|him|his)\b/.test(message) &&
		PRONOUN_PROFILE_TOPIC.test(message)
	) {
		return true;
	}

	/*
	 * Short profile queries:
	 *
	 * github
	 * email?
	 * linkedin
	 * school
	 */
	if (SHORT_PROFILE_REQUEST.test(message)) {
		return true;
	}

	/*
	 * Recruiter / client project-selection questions.
	 */
	if (
		/\b(?:which|what)\s+project\s+should\s+(?:i|a recruiter|a client)\s+(?:inspect|look at|review|start with)\b/.test(
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

	/^(?:email|linkedin|linked in|instagram|github|github account|portfolio|portfolio link|website|resume|cv|school|college|university|course|degree|program|education|age|location|contact)\??$/,
];

function isContinuation(message: string): boolean {
	return CONTINUATION.some((pattern) => pattern.test(message));
}

function hasRecentPortfolioExchange(
	history: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const previous = history[history.length - 1];

	if (
		previous?.role !== "assistant" ||
		!previous.content.trim() ||
		previous.content === OUT_OF_SCOPE_RESPONSE
	) {
		return false;
	}

	/*
	 * Each continuation must remain chained to a legitimate
	 * portfolio conversation.
	 */
	let scoped = false;

	for (let i = 0; i < history.length - 1; i++) {
		const current = history[i];

		if (current.role !== "user") continue;

		const next = history[i + 1];

		if (
			next?.role !== "assistant" ||
			next.content === OUT_OF_SCOPE_RESPONSE
		) {
			scoped = false;
			continue;
		}

		const text = normalize(current.content);

		scoped =
			isDirectlyScoped(text, knowledge) ||
			(
				scoped &&
				isContinuation(text) &&
				!hasIndependentGeneralTask(text)
			);
	}

	return scoped;
}

export function isPortfolioFollowUp(
	latestMessage: string,
	conversationHistory: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message = normalize(latestMessage);

	return (
		!hasIndependentGeneralTask(message) &&
		isContinuation(message) &&
		hasRecentPortfolioExchange(
			conversationHistory,
			knowledge,
		)
	);
}

export function isPortfolioScopedRequest(
	latestMessage: string,
	conversationHistory: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message = normalize(latestMessage);

	return (
		isDirectlyScoped(message, knowledge) ||
		isPortfolioFollowUp(
			message,
			conversationHistory,
			knowledge,
		)
	);
}