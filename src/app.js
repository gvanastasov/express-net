const express   = require('express'),
  ejs           = require('ejs')
  path          = require('path');

const { generateRouteTable } = require('./lib/route');

const context = (req, res, next) => {
  req.context = { requestContext: { req }, responseContext: { res } };
  next()
}

const router = express.Router()
router.use('/:controller?/:action?', context);

const app = express()
app.engine('.html', ejs.renderFile)

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');

app.use(express.static(path.join(__dirname, 'public')));
app.use('/', router)

generateRouteTable(app);

module.exports = { app }