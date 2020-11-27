const request = require('request');
const ZipStream = require('zip-stream');
const {PubSub} = require('@google-cloud/pubsub');
const {Storage} = require('@google-cloud/storage');
const photoModel = require('./photo_model');
const env = require('../app/public/json/lejson.json');

async function quickstart(
    projectId = env.project_id,
    subscriptionName = 'sonia'
) {
    const credentials = {
        projectId: projectId,
        credentials: env
    }

    const pubsub = new PubSub(credentials);
    const timeout = 60;
    const profileBucket = 'dmii2bucket';

    function listenForMessages() {
        const subscription = pubsub.subscription(subscriptionName);
        const queue = [];

        let messageCount = 0;
        const messageHandler = async message => {
            console.log(`Received message ${message.id}:`);
            console.log(`\tData: ${message.data}`);
            console.log(`\tAttributes: ${message.attributes}`);
            messageCount += 1;

            const storage = new Storage(credentials);
            const file = await storage.bucket(profileBucket).file('public/users/sonia.zip');
            const stream = file.createWriteStream({
                metadata: {
                    contentType: 'application/zip',
                    cacheControl: 'private'
                },
                resumable: false
            });

            const zip = new ZipStream();
            zip.pipe(stream);

            photoModel.getFlickrPhotos(message.data.tags, message.data.tagMode).then(photos => {
                for (let i = 0; i < 10; i++) {
                    queue.push({name: `${photos[i].title}.jpg`, url: photos[i].media.b});
                }

                console.log(queue.length);

                function addNextFile() {
                    const elem = queue.shift()
                    const stream = request(elem.url)
                    zip.entry(stream, {name: elem.name}, err => {
                        if (err) {
                            throw err;
                        }
                        if (queue.length > 0) {
                            addNextFile()
                        } else {
                            zip.finalize();
                        }
                    })
                }

                addNextFile();
            });

            await new Promise((resolve, reject) => {
                stream.on('error', (err) => {
                    reject(err);
                });
                stream.on('finish', () => {
                    resolve('Ok');
                });
            });

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
