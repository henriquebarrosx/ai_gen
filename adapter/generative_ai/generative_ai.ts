import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logger } from '../logger/logger.ts';

export class GenAi {
	private apiKey: string;

	constructor(private readonly logger: Logger) {
		const API_KEY = Deno.env.get("GEMINI_API_KEY");
		if (!API_KEY) throw new Error("Cannot instantiate GenerationAi: missing api key");
		this.apiKey = API_KEY;
	}

	async generate(prompt: string): Promise<string> {
		try {
			const genAI = new GoogleGenerativeAI(this.apiKey);
			const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

			const result = await model.generateContent(prompt);
			const response = result.response.text();

			this.logger.info(
				'Ai generation provider usage Metadata: \n',
				{
					...result.response.usageMetadata,
				}
			);

			return response;
		}

		catch (error) {
			if (error && typeof error === 'object' && 'message' in error) {
				this.logger.error("Something wrong happen when generating output:", error.message);
			}

			throw error;
		}
	}
}