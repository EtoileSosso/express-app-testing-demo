const formValidator = require('./form_validator');
const photoModel = require('./photo_model');
const { PubSub } = require('@google-cloud/pubsub');
const env = require('../app/public/json/lejson.json');

function route(app) {
    app.get('/', (req, res) => {
        const tags = req.query.tags;
        const tagmode = req.query.tagmode;

        const ejsLocalVariables = {
            tagsParameter: tags || '',
            tagmodeParameter: tagmode || '',
            photos: [],
            searchResults: false,
            invalidParameters: false
        };

        if (!tags && !tagmode) {
            return res.render('index', ejsLocalVariables);
        }

        if (!formValidator.hasValidFlickrAPIParams(tags, tagmode)) {
            ejsLocalVariables.invalidParameters = true;
            return res.render('index', ejsLocalVariables);
        }

        return photoModel
            .getFlickrPhotos(tags, tagmode)
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

        const ejsLocalVariables = {
            tagsParameter: tags || '',
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

            topic.publish(Buffer.from(JSON.stringify({tags})));
        }

        quickstart();
    });
}

module.exports = route;
