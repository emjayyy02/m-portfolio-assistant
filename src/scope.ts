import type { ChatMessage } from "./types";

export const OUT_OF_SCOPE_RESPONSE =
	"I'm only here for Mj and his portfolio 😅. Ask me about his projects, skills, experience, education, or how his systems were built.";

function normalize(value: string): string {
	return value.normalize("NFKC").toLowerCase().replace(/[\u200b-\u200d\ufeff]/g, "").replace(/[’‘]/g, "'").replace(/\s+/g, " ").trim();
}

/** Only approved names, never technology or capability headings, confer scope. */
export function extractPortfolioKnowledgeTerms(knowledge: string): string[] {
	const terms = new Set<string>();
	let section = "";
	for (const line of knowledge.split(/\r?\n/)) {
		const sectionMatch = /^##\s+(.+?)\s*$/.exec(line);
		if (sectionMatch) {
			section = normalize(sectionMatch[1]);
			continue;
		}
		if (!/^(projects|certifications|education)$/.test(section)) continue;
		const heading = /^###\s+(.+?)\s*$/.exec(line);
		const namedField = section === "certifications"
			? /^Provider:\s*(.+?)\s*$/.exec(line)
			: section === "education"
				? /^Institution:\s*(.+?)\s*$/.exec(line)
				: null;
		const name = heading?.[1] ?? namedField?.[1];
		if (name && name.length >= 4) terms.add(normalize(name));
	}
	return [...terms];
}

function mentionsKnownEntity(message: string, knowledge: string): boolean {
	return extractPortfolioKnowledgeTerms(knowledge).some((term) => {
		const index = message.indexOf(term);
		if (index < 0) return false;
		const before = message[index - 1] ?? " ";
		const after = message[index + term.length] ?? " ";
		return !/[\p{L}\p{N}]/u.test(before) && !/[\p{L}\p{N}]/u.test(after);
	});
}

/** A mixed request cannot use one portfolio mention to unlock a general task. */
function hasIndependentGeneralTask(message: string): boolean {
	return /\b(?:write|create|make|build|fix|debug|teach|solve|calculate|generate)\s+(?:(?:me|my|a|an|some|the|this|for me)\s+){0,3}(?:java|python|react|javascript|typescript|html|css|sql|code|script|component|app|website|calculator|game|essay|poem|story|email|equation|assignment|quiz)\b/.test(message) ||
		/\b(?:what's|what is|tell me)\s+(?:the\s+)?(?:weather|capital of|score of|latest news)\b/.test(message) ||
		/\b(?:tell me a joke|give me relationship advice|explain (?:photosynthesis|quantum physics|world war)|who (?:is|was|invented))\b/.test(message);
}

function isDirectlyScoped(message: string, knowledge: string): boolean {
	if (hasIndependentGeneralTask(message)) return false;
	if (/\b(?:marvin(?: silverio)?|mj)\b/.test(message)) return true;
	if (mentionsKnownEntity(message, knowledge)) return true;
	if (/\b(?:this|his|marvin's|mj's)\s+(?:portfolio|website|site|projects?|skills?|work|experience|background|education|certifications?|resume|career|professional direction|tech stack|strongest project|automation)\b/.test(message)) return true;
	if (/\bportfolio\s+(?:website|site|assistant|project|knowledge)\b/.test(message)) return true;
	if (/\b(?:what is m|how (?:was|is|does) m|what model does m|why does m|m's (?:architecture|model|security|portfolio))\b/.test(message)) return true;
	if (/\b(?:this|the)\s+(?:portfolio\s+)?assistant\b/.test(message)) return true;
	if (/\b(?:he|him|his)\b/.test(message) && /\b(?:age|old|email|contact|linkedin|instagram|github|study|studies|student|school|college|university|degree|from|location|built|build|projects?|skills?|technologies|tech stack|know|knows|used|use|work|worked|works|experience|background|strengths?|developing|career|role|fit|automation|api|webhooks?|backend|frontend|failure cases|certifications?|education|resume|professional)\b/.test(message)) return true;
	if (/\b(?:which|what)\s+project\s+should\s+(?:i|a recruiter|a client)\s+(?:inspect|look at|review|start with)\b/.test(message)) return true;
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
];

function isContinuation(message: string): boolean {
	return CONTINUATION.some((pattern) => pattern.test(message));
}

function hasRecentPortfolioExchange(history: readonly ChatMessage[], knowledge: string): boolean {
	const previous = history[history.length - 1];
	if (previous?.role !== "assistant" || !previous.content.trim() || previous.content === OUT_OF_SCOPE_RESPONSE) return false;
	// Walk the short client-provided history in order. Each accepted continuation
	// must be linked to a preceding portfolio exchange, not merely an old topic.
	let scoped = false;
	for (let i = 0; i < history.length - 1; i++) {
		const current = history[i];
		if (current.role !== "user") continue;
		const next = history[i + 1];
		if (next?.role !== "assistant" || next.content === OUT_OF_SCOPE_RESPONSE) {
			scoped = false;
			continue;
		}
		const text = normalize(current.content);
		scoped = isDirectlyScoped(text, knowledge) ||
			(scoped && isContinuation(text) && !hasIndependentGeneralTask(text));
	}
	return scoped;
}

export function isPortfolioFollowUp(
	latestMessage: string,
	conversationHistory: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message = normalize(latestMessage);
	return !hasIndependentGeneralTask(message) &&
		isContinuation(message) &&
		hasRecentPortfolioExchange(conversationHistory, knowledge);
}

export function isPortfolioScopedRequest(
	latestMessage: string,
	conversationHistory: readonly ChatMessage[],
	knowledge: string,
): boolean {
	const message = normalize(latestMessage);
	return isDirectlyScoped(message, knowledge) ||
		isPortfolioFollowUp(message, conversationHistory, knowledge);
}
