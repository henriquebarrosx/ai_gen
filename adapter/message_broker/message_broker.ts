import { connect } from "https://deno.land/x/amqp@v0.23.0/mod.ts"
import type { AmqpConnection, AmqpChannel } from "https://deno.land/x/amqp@v0.23.0/mod.ts"

import { Logger } from "../logger/logger.ts";
import type { MessageBrokerQueues } from "./queues.ts";

type PublishParams = {
	queue: MessageBrokerQueues;
	message: unknown;
}

type ConsumerParams = {
	queue: MessageBrokerQueues;
	callback: (data: string) => Promise<void>;
}

export class MessageBroker {
	private conn?: AmqpConnection;

	constructor(
		private readonly logger: Logger,
	) { }

	async connect() {
		const url = Deno.env.get("RABBITMQ_URL");
		if (!url) throw new Error('Cannot initilize message broker: url not defined');

		this.conn = await connect(url);
		this.logger.info('Message broker connection established');
	}

	async publish({ queue, message }: PublishParams) {
		if (!this.conn) {
			throw new Error('Cannot publish message: must establish a connection first')
		}

		const channel = await this.conn.openChannel();

		await channel.declareQueue(
			{
				durable: true,
				queue: queue,
			}
		);

		const correlationId = crypto.randomUUID();

		await channel.publish(
			{
				routingKey: queue,
			},
			{
				contentType: 'application/json',
				correlationId: correlationId,
			},
			new TextEncoder().encode(JSON.stringify(message))
		)

		this.logger.info(
			'Publishing new message: \n',
			{
				event: 'PUBLISH',
				queue: queue,
				id: correlationId,
			}
		);
	}

	async listen({ queue, callback }: ConsumerParams) {
		if (!this.conn) {
			throw new Error(`Cannot consume message for queue ${queue}: must establish a connection first`)
		}

		const channel = await this.conn.openChannel();

		await channel.declareQueue(
			{
				queue: queue,
				durable: true,
			}
		);

		await channel.consume(
			{
				queue: queue,
				noAck: false,
			},
			async (args, props, message) => {
				const data = new TextDecoder().decode(message)

				this.logger.info(
					'Receiving new message: \n',
					{
						id: props.correlationId,
						event: 'RECEIVED',
						redelivered: args.redelivered,
						queue: queue,
					}
				);

				try {
					await callback(data);

					await channel.ack(
						{
							deliveryTag: args.deliveryTag,
							multiple: false,
						}
					);
				}

				catch {
					await this.asyncRetry(channel, args.deliveryTag, 15_000)
				}
			}
		)

		this.logger.info(`New message broker consumer registered for queue ${queue}`);
	}

	private async asyncRetry(channel: AmqpChannel, deliveryTag: number, time: number) {
		await new Promise((resolve) => setTimeout(resolve, time));

		await channel.nack(
			{
				deliveryTag: deliveryTag,
				multiple: false,
				requeue: true,
			}
		)
	}
}