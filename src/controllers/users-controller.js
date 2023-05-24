const { users } = require('../data/db')

const controller = {
    index: {
        method: 'get',
        action: function() {
            return this.view();
        }
    },
    show: {
        method: 'get',
        action: function() {
            return this.view({ 
                viewBag: { 
                    users 
                },
            });
        }
    },
}

module.exports = controller;
