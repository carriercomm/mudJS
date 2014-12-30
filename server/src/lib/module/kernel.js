// Command parsing and execution

var Module          = require('../module'),
    _               = require('underscore'),
    CharacterModule = require('./character'),
    utils           = require('./utils');

// Commands
var GetCmd         = require('./command/get'),
    HelpCmd        = require('./command/help'),
    LogoutCmd      = require('./command/logout'),
    LookCmd        = require('./command/look'),
    SysTeleportCmd = require('./command/sys_teleport'),
    WalkCmd        = require('./command/walk');

var KernelModule = function(world) {
    'use strict';
    
    var self = new Module();

    self.initialize = function() {
        self.world = world;
        self.index = {};

        // build search index for commands
        for(var i = 0; i < self.commands.length; i++) {
            var cmd = self.commands[i];
            for(var w = 0; w <  cmd.indexes.length; w++) {
                var word      = cmd.indexes[w];
                var chars     = word.split('');
                var index_key = '';

                for(var c = 0; c < chars.length; c++) {
                    index_key = index_key + chars[c];
                    if( !self.index[ index_key ] ) self.index[ index_key ] = [];
                    self.index[ index_key ].push(cmd);
                }
            }
        }
    };

    function execute__meta() {
        return {
            'cmdLine' : {
                'required' : true,
                'type'     : 'string'
            },
            'session'  : {
                'required' : true,
                'type'     : 'object'
            },
            'callback' : {
                'required' : true,
                'type'     : 'function'
            },
            'internal' : {
                'desc' : 'Set this to set the permission group to internal for internal commands',
                'type' : 'boolean'
            }
        };
    }

    // find and run a command based on the command line provided
    self.execute = function(args) {
        var check = self.validate(execute__meta(), args);
        if(! check.is_valid) throw check.errors();
        
        args.internal = args.internal || false;
        
        // always load the character first so we can pass the character model to every command
        new CharacterModule(self.app).findMe({ id: args.session.sessionCharacter()._id }, function(character) {
            // find_command needs the character object
            args.character = character;
            
            var cmdResp = self.findCmd(args);
            
            if('undefined' === typeof cmdResp.cmd) {
                var cmd_soundex  = [],
                    word_soundex = utils.soundex({ 'string' : cmdResp.word });
                
                for(var cs = 0; cs < cmdResp.possible_cmds.length; cs++) {
                    if(cmdResp.possible_cmds[cs].is_soundex_match({ 'soundex' : word_soundex }))
                        cmd_soundex.push(cmdResp.possible_cmds[cs].id);
                }

                var output = 'Command not found.';

                if(cmd_soundex.length > 0)
                    output = output + ' ' + ' Did you mean:{{br()}}{{tab()}}' + cmd_soundex.join(', ');

                args.callback({ output: output });
                return;
            }

            // Add more data to args before passing on to a command
            var cmdArgs = _.clone(args);
            _.extend(cmdArgs, {
                words     : cmdResp.words,
                kernel    : self,
                callback  : function(resp) {
                    if(! _.has(resp, 'character')) _.extend(resp, { character: character.model.toObject() }); // Make sure character is in the response always

                    // Update character in session
                    args.session.sessionCharacter( resp.character );

                    args.callback(resp);
                }
            });
            
            // Execute it
            cmdResp.cmd.execute(cmdArgs);
        });
    };
    
    function findCmd__meta() {
        return {
            'cmdLine' : {
                'required' : true,
                'type'     : 'string'
            },
            'character' : {
                'required' : true,
                'type'     : 'object'
            },
            'internal' : {
                'desc' : 'Set this to set the permission group to internal for internal commands',
                'type' : 'boolean'
            }
        };
    }
    
    self.findCmd = function(args) {
        var check = self.validate(findCmd__meta(), args);
        if(! check.is_valid) throw check.errors();
        
        args.internal = args.internal || false;
        
        var words    = (args.cmdLine.split(/\s+/)),
            word     = words[0],
            commands = [];
        
        // Find command by first word (abbreviations allowed)
        for(var c = 0; c < word.length; c++) {
            if(self.index[ word ]) {
                commands = _.union(commands, self.index[ word ]);
                break;
            }
    
            word = word.substr(0, word.length - 1);
        }
        
        // Find the first one that matches
        var cmdFound;
        for(var i = 0; i < commands.length; i++) {
            var cmd = commands[i];
    
            if((args.internal || _.contains(cmd.permissionGroups, args.character.permissionGroup())) && cmd.regex.test(args.cmdLine)) {
                cmdFound = cmd;
                break;
            }
        }
        
        return {
            cmd           : cmdFound,
            word          : words[0], 
            words         : words,
            possible_cmds : commands
        };
    };

    // list of command objects
    self.commands = [
        new GetCmd(world),
        new HelpCmd(world),
        new LogoutCmd(world),
        new LookCmd(world),
        new SysTeleportCmd(world),
        new WalkCmd(world)
    ];

    self.initialize();

    return self;
};

module.exports = KernelModule;
