const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const {PubSub} = require('@google-cloud/pubsub');
const env = require('../app/public/json/lejson.json');
const moment = require('moment');
const {Storage} = require('@google-cloud/storage');
const request = require('request');

function route(app) {
    app.get('/', (req, res) => {
        const tags = req.query.tags;
        const tagMode = req.query.tagmode;

        const ejsLocalVariables = {
            tagsParameter: tags || '',
            tagmodeParameter: tagMode || '',
            photos: [],
            searchResults: false,
            invalidParameters: false
        };

        if (!tags && !tagMode) {
            return res.render('index', ejsLocalVariables);
        }

        if (!formValidator.hasValidFlickrAPIParams(tags, tagMode)) {
            ejsLocalVariables.invalidParameters = true;
            return res.render('index', ejsLocalVariables);
        }

        return photoModel
            .getFlickrPhotos(tags, tagMode)
            .then(photos => {
                ejsLocalVariables.photos = photos;
                ejsLocalVariables.searchResults = true;
                return res.render('index', ejsLocalVariables);
            })
            .catch(error => {
                return res.status(500).send({error});
            });
    });

    app.get('/zip', (req, res) => {
        const tags = req.query.tags;
        const tagMode = req.query.tagmode;

        const ejsLocalVariables = {
            tagsParameter: tags || '',
            tagmodeParameter: tagMode || '',
            photos: [],
            searchResults: false,
            invalidParameters: false,
        };

        if (!tags) {
            return res.render('oui', ejsLocalVariables);
        }

        async function quickstart(
            projectId = env.project_id,
            topicName = 'sonia',
            subscriptionName = 'sonia'
        ) {
            const credentials = {
                projectId: env.project_id,
                credentials: env
            }

            const pubsub = new PubSub(credentials);

            const topic = await pubsub.topic(topicName);
            console.log(`Got topic ${topic.name}.`);

            const subscription = await topic.subscription(subscriptionName);
            console.log(`Got subscription ${subscription.name}.`);

            topic.publish(Buffer.from(JSON.stringify({tags, tagMode: tagMode})));
        }

        quickstart();


        return res.render('oui', ejsLocalVariables);
    });
    app.get('/download-zip', (req, res) => {
        async function getFile() {
            const options = {
                action: 'read',
                expires: moment().add(2, 'days').unix() * 1000,
            }
            const credentials = {
                projectId: env.project_id,
                credentials: env
            }

            const storage = new Storage(credentials);
            const signedUrls = await storage.bucket('dmii2bucket')
                .file('public/users/sonia.zip')
                .getSignedUrl(options);

            if (signedUrls) {
                res.redirect(signedUrls);
            }
        }

        getFile();
    });
}

module.exports = route;
