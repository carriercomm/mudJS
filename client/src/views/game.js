// The game view

module.exports = (function() {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        template: require('../../templates/game.html'),

        className: 'game',

        events: {
            'keyup #command': 'execCommand'
        },

        initialize: function() {
            var self = this;
        },

        onShow: function() {
            var self = this;

            self.$console = $(self.$el.find('#console'));
            self.$command = $(self.$el.find('#command'));

            var radio = Backbone.Wreqr.radio.channel('global');
            radio.vent.trigger('enterWorld', function(resp) {

                // Save world data for later use
                self.character = resp.data.result.character;
                self.place     = resp.data.result.place;

                self.addToConsole("Welcome " + self.character.fullName + "!{{ br() }}{{ br() }}" + resp.data.result.output + "{{ br() }}{{ br() }}");
            });

            self.$command.focus();
        },

        addToConsole: function(output) {
            var self = this;

            self.$console.html( self.$console.html() + self.parse(output) );

            self.$console.scrollTop(self.$console[0].scrollHeight); // keep the scroll posittion at the bottom
        },

        parse: function(html) {
            var self = this;

            var oldSettings = _.templateSettings;
            _.templateSettings = {
                interpolate: /\{\{(.+?)\}\}/g
            };

            var parsed = (_.template(html))(self.templateEnv());

            _.templateSettings = oldSettings;

            return parsed;
        },

        templateEnv: function() {
            return {
                br: function() {
                    return '<br>';
                },
                tab : function() {
                    return '&nbsp;&nbsp;&nbsp;&nbsp;';
                },
                gt: function() {
                    return '&gt;';
                },
                lt: function() {
                    return '&lt;';
                }
            };
        },

        execCommand: function(ev) {
            var self = this;
            var keyCode = ev.keyCode || ev.which;

            // Process command on enter
            if (keyCode == '13') {
                var command = self.$command.val();

                // empty command input
                self.$command.val('');

                //clean up command
                var filters = self.commandFilters();
                for(var q = 0; q < filters.length; q += 2) {
                    var re = filters[q];
                    command = command.replace(re, filters[q + 1]);
                }

                if(command.match(/\w/)) {
                    // print it out before sending
                    self.addToConsole('> ' + command + '{{ br() }}{{ br() }}');

                    var radio = Backbone.Wreqr.radio.channel('global');
                    radio.vent.trigger('execCommand', { command: command }, function(resp) {
                        if(resp.success) {
                            if(resp.data.result && resp.data.result.character)
                                self.character = resp.data.result.character;

                            if(resp.data.result && resp.data.result.place)
                                self.place = resp.data.result.place;

                            if(resp.data.result && resp.data.result.output)
                                self.addToConsole(resp.data.result.output + '{{br()}}{{br()}}');

                            if(resp.data.result && resp.data.result.logout){
                                var radio = Backbone.Wreqr.radio.channel('global');
                                radio.vent.trigger('logout');
                            }
                        }
                        else {
                            self.addToConsole(resp.message + '{{ br() }}{{ br() }}');
                        }
                    });
                }
            }
        },

        commandFilters: function() {
            return  [
                new RegExp('^\\s*'), '',               // whitespace
                new RegExp('\\{\\{','g'), '',           // _ template interpolation
                new RegExp('\\}\\}','g'), '',           // _ template interpolation
                new RegExp('<(?:.|\\n)*?>','gm'), '', // html
                new RegExp('&(?:.|\\n)*?;','gm'), '', // html entities
                new RegExp('<','g'), '&lt;',          // encode <
                new RegExp('>','g'), '&gt;'           // encode >
            ];
        }

    });
})();
