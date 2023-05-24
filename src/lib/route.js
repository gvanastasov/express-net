const express = require('express'),
    fs          = require('fs'),
    path        = require('path')

    /**
     * @description this needs quite some love to be where it should be, but for now
     * id does the job. Its used as prototype chain to controller module objects.
     * We always want to render _layout, and then include the view from the control/action
     * resolver and pass a viewBag to it.
     * @param {*} options 
     * @param {*} context 
     */
function baseController(options, context) {
    this.options = options;
    this.context = context;
    this.view = function(options) {
        let optionsInternal = { ...this.options, ...options };
        let viewName = optionsInternal.viewName || 'index';
        this.context.responseContext.res.render(
            'shared/_layout',
            {
                title: 'Example MVC',
                body: "..\\" + viewName + ".html",
                viewBag: optionsInternal.viewBag,
            });
    }
}

/**
 * @description this boots up the sub routing, by itterating over
 * controllers folder. For each controller we identify actions (with 
 * specific signature) which is then prototype chained to baseController
 * in order to create route with a handler. 
 * 
 * @param {*} parent 
 * @param {*} options 
 */
const generateRouteTable = function(parent, options = { default: { controller: 'home', action: 'index' }}) {
    const controllersRegex = /-controller.js$/;
    const controllersDirectory = path.join(__dirname, '..', 'controllers');
    
    fs
        .readdirSync(controllersDirectory)
        .forEach(name => {
            let file = path.join(controllersDirectory, name);

            // todo: can be improved with nested directories, but for simplicity
            // sake, 0 level depth is used.
            if (fs.statSync(file).isDirectory()) {
                return;
            }

            if (!controllersRegex.test(name)) {
                return;
            }
            
            let [controllerName] = name.split(controllersRegex)

            let obj = require(file);
            let actions = Object.keys(obj).reduce((arr, key) => {
                let property = obj[key];
                
                let isObject = typeof property === 'object' &&
                    !Array.isArray(property) &&
                    property !== null;
                if (!isObject) {
                    return;
                }

                let isAction = property.hasOwnProperty('action');
                if (!isAction) {
                    return;
                }

                arr.push({ 
                    name: key, 
                    route: { method: property.method }, 
                    handler: property.action 
                });

                return arr;
            }, []);

            var app = express();
            app.set('views', path.join(__dirname, '..', 'views'));
            app.set('view engine', 'html');

            actions.forEach(action => {
                let method = action.route.method || 'get';
                let route = `/${controllerName}/${action.name}`;
                let viewName = path.join(controllerName, action.name);
                
                let handler = (req, _res, _next) => {
                    function controller() {
                        this.action = action.handler;
                    }
                    controller.prototype = new baseController({ viewName }, req.context);
                    controller.prototype.constructor = controller;

                    var instance = new controller();
                    instance.action();
                };

                app[method](route, handler);

                if (viewName === options.default.action) {
                    app[method](`/${controllerName}`, handler);
                }

                if (controllerName === options.default.controller) {
                    app[method]('/', handler);
                }
            })

            parent.use(app);
        })
}

module.exports = { generateRouteTable }