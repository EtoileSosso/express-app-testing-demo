const express = require('express');
const favicon = require('serve-favicon');
const path = require('path');
require('./worker');

const app = express();

const dd_options = {
    'response_code':true,
    'tags': ['app:my_app']
}

const connect_datadog = require('connect-datadog')(dd_options);

// public assets
app.use(express.static(path.join(__dirname, 'public')));
app.use(favicon(path.join(__dirname, 'public/images', 'favicon.ico')));
app.use('/coverage', express.static(path.join(__dirname, '..', 'coverage')));

// ejs for view templates
app.engine('.html', require('ejs').__express);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(connect_datadog);

// load route
require('./route')(app);

// server
const port = process.env.PORT || 3000;
app.server = app.listen(port);
console.log(`listening on port ${port}`);

module.exports = app;
