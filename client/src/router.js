// App router

var Router = Marionette.AppRouter.extend({
    appRoutes: {
        ''         : 'login',
        'login'    : 'login',
        'register' : 'register',
        'lobby'    : 'lobby',
    }
});

module.exports = Router;