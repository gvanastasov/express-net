const controller = {
    index: {
        method: 'get',
        action: function() {
            return this.view();
        }
    }
}

module.exports = controller;
