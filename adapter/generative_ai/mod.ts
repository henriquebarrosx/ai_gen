import { Logger } from "../logger/logger.ts";
import { GenAi } from "./generative_ai.ts";

export const genAi = new GenAi(new Logger());