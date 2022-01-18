const amqp = require('amqplib');

const rabbitmqHost = process.env.RABBITMQ_HOST || 'localhost';
const rabbitmqUrl = `amqp://${rabbitmqHost}`;

let connection = null;
let channel = null;

async function connectToRabbitMQ(queue) {
    connection = await amqp.connect(rabbitmqUrl);
    channel = await connection.createChannel();
    await channel.assertQueue(queue);
}
exports.connectToRabbitMQ = connectToRabbitMQ;

function getChannel() {
    return channel;
}
exports.getChannel = getChannel;