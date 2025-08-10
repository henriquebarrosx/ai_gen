import { genAi } from "./adapter/generative_ai/mod.ts";
import { MessageBrokerSingleton } from "./adapter/message_broker/message_broker_singleton.ts";
import { MessageBrokerQueues } from "./adapter/message_broker/queues.ts";
import { THE_NEWS_PROMPT } from "./prompts/the_news.ts";

const messageBroker = MessageBrokerSingleton.getInstance();
await messageBroker.connect();

await messageBroker.listen({
  queue: MessageBrokerQueues.THE_NEWS_ARTICLE_GENERATION,
  callback: async (res) => {
    const { input } = JSON.parse(res);

    const prompt = `
            ${THE_NEWS_PROMPT}
            ${input}
        `

    const result = await genAi.generate(prompt);
    const output = result.replace('```json', '').replace('```', '')

    await messageBroker.publish({
      queue: MessageBrokerQueues.THE_NEWS_ARTICLE_STORE,
      message: JSON.parse(output),
    });
  }
});
