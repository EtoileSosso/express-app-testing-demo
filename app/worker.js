const {PubSub} = require('@google-cloud/pubsub');
const request = require('request');
const ZipStream = require('zip-stream');
const photoModel = require('./photo_model');
const env = require('../app/public/json/lejson.json');

async function quickstart (
    projectId = env.project_id,
    topicName = 'sonia',
    subscriptionName = 'sonia'
) {
    const credentials = {
        projectId: env.project_id,
        credentials: env
    }

    const pubsub = new PubSub(credentials);
    const timeout = 60;

    function listenForMessages() {
        const subscription = pubsub.subscription('sonia');

        let messageCount = 0;
        const messageHandler = message => {
            console.log(`Received message ${message.id}:`);
            console.log(`\tData: ${message.data}`);
            console.log(`\tAttributes: ${message.attributes}`);
            messageCount += 1;

            message.ack();
        };

        subscription.on('message', messageHandler);

        setTimeout(() => {
            subscription.removeListener('message', messageHandler);
            console.log(`${messageCount} message(s) received.`);
        }, timeout * 1000);
    }

    listenForMessages();
}

module.exports = quickstart();
