const request = require('request');
const ZipStream = require('zip-stream');
const {PubSub} = require('@google-cloud/pubsub');
const {Storage} = require('@google-cloud/storage');
const photoModel = require('./photo_model');
const env = require('../app/public/json/lejson.json');
const firebaseConfig = require('./firebaseconfig');
const firebase = require('firebase-admin');

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

    const credentials_admin = firebase.credential.cert(env)
    firebase.initializeApp({
        credential: credentials_admin,
        databaseURL: firebaseConfig.databaseUrl,
        projectId: 'channelmessaging'
    });

    function listenForMessages() {
        const subscription = pubsub.subscription(subscriptionName);
        const queue = [];

        let messageCount = 0;
        const messageHandler = async message => {
            const data = JSON.parse(message.data);
            console.log(`Received message ${message.id}:`);
            console.log(`\tData: ${message.data}`);
            console.log(`\tAttributes: ${message.attributes}`);
            messageCount += 1;

            const storage = new Storage(credentials);
            const file = await storage.bucket(profileBucket).file(`public/users/${data.tags}.zip`);
            const stream = file.createWriteStream({
                metadata: {
                    contentType: 'application/zip',
                    cacheControl: 'private'
                },
                resumable: false
            });

            const zip = new ZipStream();
            zip.pipe(stream);

            photoModel.getFlickrPhotos(data.tags, data.tagMode).then(photos => {
                for (let i = 0; i < 10; i++) {
                    queue.push({name: `${photos[i].title}.jpg`, url: photos[i].media.b});
                }

                function addNextFile() {
                    const elem = queue.shift()
                    const stream = request(elem.url)
                    zip.entry(stream, {name: elem.name}, async err => {
                        if (err) {
                            throw err;
                        }
                        if (queue.length > 0) {
                            addNextFile()
                        } else {
                            zip.finalize();
                            const date = Date.now();
                            await firebase.database().ref(`/sonia/${date}`).set({file: `public/users/${data.tags}.zip`});
                            const results = await firebase.database().ref(`/sonia`).once('value');
                        }
                    });
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
