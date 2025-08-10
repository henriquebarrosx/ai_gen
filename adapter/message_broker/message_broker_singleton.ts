import { Logger } from "../logger/logger.ts";
import { MessageBroker } from "./message_broker.ts";

export class MessageBrokerSingleton {
	private static instance: MessageBroker;

	private constructor() { }

	static getInstance() {
		if (!MessageBrokerSingleton.instance) {
			MessageBrokerSingleton.instance = new MessageBroker(new Logger());
		}

		return MessageBrokerSingleton.instance;
	}
}