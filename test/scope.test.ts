import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import type { ChatMessage } from "../src/types";
import {
	OUT_OF_SCOPE_RESPONSE,
	extractPortfolioKnowledgeTerms,
	isPortfolioFollowUp,
	isPortfolioScopedRequest,
} from "../src/scope";

const knowledge = readFileSync(new URL("../docs/portfolio-generated.md", import.meta.url), "utf8");

const scoped = (message: string, history: ChatMessage[] = []) =>
	isPortfolioScopedRequest(message, history, knowledge);

describe("portfolio scope gate", () => {
	it.each([
		"give me a simple if else code written in java",
		"write hello world in python",
		"teach me react",
		"what is n8n",
		"explain REST APIs",
		"write an essay about globalization",
		"solve 5x + 2 = 10",
		"what's the capital of japan",
		"write me a poem",
		"give me relationship advice",
		"create a todo app",
		"make me a website",
		"fix my javascript",
		"what is machine learning",
		"who is lebron james",
		"tell me a joke",
		"write me an email",
		"explain JavaScript closures",
		"How does Java work?",
		"Marvin, write me a Python snake game.",
		"Marvin, tell me a joke.",
		"Marvin, explain photosynthesis.",
	])("rejects %s", (message) => {
		expect(scoped(message)).toBe(false);
	});

	it.each([
		"what projects has Marvin built?",
		"what projects has he built?",
		"what's his email?",
		"what does he study?",
		"how old is Mj?",
		"what's his tech stack?",
		"does Marvin know React?",
		"how has Marvin used React?",
		"what is Revenue Recovery OS?",
		"explain the AI Support Operations Triage System",
		"how does Invoice Collections Automation work?",
		"which project shows his JavaScript skills?",
		"what is M?",
		"how was M built?",
		"how does M protect against prompt injection?",
		"which project should a recruiter inspect first?",
		"can Marvin be contacted for automation work?",
		"What are his strengths?",
		"What areas is he still developing?",
		"Would his work fit an automation specialist role?",
		"What evidence does he have for API skills?",
		"How does he handle failure cases?",
		"Could Marvin build an automation like this?",
		"Can I contact him about a project?",
		"What tools does he use for automation?",
		"Has he worked with Google Sheets?",
		"What is Offangle?",
		"Tell me about Dr. Filemon C. Aguilar Memorial College of Las Piñas",
	])("allows %s", (message) => {
		expect(scoped(message)).toBe(true);
	});

	it("derives only named portfolio entities from approved knowledge", () => {
		const terms = extractPortfolioKnowledgeTerms(knowledge);
		expect(terms).toContain("revenue recovery os");
		expect(terms).toContain("bachelor of science in information systems");
		expect(terms).toContain("n8n academy");
		expect(terms).not.toContain("react");
		const future = "## Projects\n### Future Automation Project\n## Skills & Capabilities\n### React";
		expect(isPortfolioScopedRequest("Explain Future Automation Project", [], future)).toBe(true);
		expect(isPortfolioScopedRequest("Explain React", [], future)).toBe(false);
	});

	const firstExchange: ChatMessage[] = [
		{ role: "user", content: "What is Revenue Recovery OS?" },
		{ role: "assistant", content: "It's Mj's customer recovery operations project." },
	];

	it.each([
		"How does the AI part work?",
		"why?",
		"how?",
		"what about the second one?",
		"which one is better for automation?",
		"can you explain that?",
		"does it have a live demo?",
		"what was the hardest part?",
		"how was that validated?",
		"and the frontend?",
		"what about security?",
	])("allows contextual follow-up: %s", (message) => {
		expect(isPortfolioFollowUp(message, firstExchange, knowledge)).toBe(true);
		expect(scoped(message, firstExchange)).toBe(true);
		expect(scoped(message)).toBe(false);
	});

	it("allows a pronoun follow-up", () => {
		const history: ChatMessage[] = [
			{ role: "user", content: "Tell me about Workflow Operations Manager." },
			{ role: "assistant", content: "It's a frontend operations dashboard." },
		];
		expect(scoped("What technologies did he use for it?", history)).toBe(true);
	});

	it("does not unlock unrelated pivots after several valid turns", () => {
		const history: ChatMessage[] = [
			...firstExchange,
			{ role: "user", content: "How does the AI part work?" },
			{ role: "assistant", content: "AI assists the workflow." },
		];
		expect(scoped("Now write me a Java calculator.", history)).toBe(false);
		expect(scoped("What's the weather today?", history)).toBe(false);
		expect(scoped("Teach me React.", history)).toBe(false);
		expect(scoped("How does Java work?", history)).toBe(false);
		expect(scoped("What about quantum physics?", history)).toBe(false);
		expect(scoped("Tell me more about World War II.", history)).toBe(false);
		expect(scoped("What about the backend?", history)).toBe(true);
	});

	it("requires a recent legitimate exchange", () => {
		const refusalHistory: ChatMessage[] = [
			{ role: "user", content: "Tell me a joke" },
			{ role: "assistant", content: OUT_OF_SCOPE_RESPONSE },
		];
		expect(scoped("why?", refusalHistory)).toBe(false);
		expect(scoped("why?", [{ role: "user", content: "What is Revenue Recovery OS?" }])).toBe(false);
	});
});
