// Oddly enough, this statement returns an executable path to the flow binary:
var flowBinPath = require('flow-bin');
var when = require('when');
var assign = require('object-assign');


var availableCommands = {

  start: function(grunt, data, args) {
    var magicStatuses = {
      serverAlreadyRunning: 11,
    }
    return flow(grunt, ['start'].concat(makeOptions(data)), {
        validStatuses: [
          0,
          magicStatuses.serverAlreadyRunning,
        ],
      })
      .then(function(result) {
        if (result.code === magicStatuses.serverAlreadyRunning) {
          grunt.log.writeln('flow server was already running');
        } else {
          grunt.log.writeln(result.stdout || result.stderr);
        }
      });
  },

  stop: function(grunt, data, args) {
    return flow(grunt, ['stop'].concat(makeOptions(data)))
      .then(function(result) {
        grunt.log.writeln(result.stdout || result.stderr);
      });
  },

  check: function(grunt, data, args) {
    return checkForFlowErrors(grunt, 'check', data);
  },

  status: function(grunt, data, args) {
    return checkForFlowErrors(grunt, 'status', data);
  },

};


function flow(grunt, args, opt) {
  opt = opt || {};
  opt.validStatuses = opt.validStatuses || [0];
  opt.spawn = opt.spawn || grunt.util.spawn;

  return when.promise(function(resolve, reject) {
    var config = {
      cmd: flowBinPath,
      args: args,
    };
    grunt.verbose.ok('spawning command:', config, opt);

    opt.spawn(config, function(error, result, code) {
      grunt.verbose.ok('spawned command result:', error, result, code);

      if (opt.validStatuses.indexOf(code) === -1) {
        return reject(
          new Error(config.cmd + ' exited ' + code + '; result: ' + result));
      }

      resolve(result);
    });
  });
}


function checkForFlowErrors(grunt, cmd, options, config) {
  var magicStatuses = {
    flowError: 2,  // a Flow error in some files
  };
  var cmdOpts = makeOptions(options, {
    color: 'always',
  });
  var conf = assign({
    flow: flow,
  }, config);

  return conf.flow(grunt, [cmd].concat(cmdOpts), {
      validStatuses: [
        0,
        magicStatuses.flowError,
      ],
    })
    .then(function(result) {
      grunt.log.writeln(result.stdout || result.stderr);
      if (result.code !== 0) {
        throw new Error('flow ' + cmd + ' exited ' + result.code);
      }
    });
}


function makeOptions(optionData, defaults) {
  optionData = assign({}, defaults, optionData);
  var options = [];

  Object.keys(optionData).forEach(function(key) {
    var opt = '--' + key;
    if (optionData[key] !== null) {
      // Empty options look like --thing="".
      // A null value makes a flag like --thing
      opt += '=' + (optionData[key] || '""');
    }
    options.push(opt);
  });

  return options;
}


module.exports = function(grunt, opt) {
  opt = opt || {};
  opt.flow = opt.flow || flow;
  opt.availableCommands = opt.availableCommands || availableCommands;
  opt.registerMultiTask = (opt.registerMultiTask ||
                           grunt.registerMultiTask);

  opt.registerMultiTask('flowbin',
                        'Execute Facebook\'s Flow tool, a static type checker',
                        function() {
    var done = this.async();
    var target = this.target;
    var data = this.data;
    var args = this.args;
    var command;

    grunt.verbose.ok('executing target: ' + target);

    var command = opt.availableCommands[target];
    var promisedCommand;

    if (!command) {
      grunt.log.writeln('running unsupported flow command,', target,
                        '; this may do unexpected things.');
      promisedCommand = opt.flow(grunt, [target].concat(makeOptions(data)))
        .then(function(result) {
          grunt.log.writeln(result.stdout || result.stderr);
        });
    } else {
      promisedCommand = command(grunt, data, args);
    }

    promisedCommand
      .then(function() {
        done(true);
      })
      .catch(function(error) {
        grunt.log.error(error);
        done(false);
      });
  });

};

module.exports.flow = flow;
module.exports.makeOptions = makeOptions;
module.exports.checkForFlowErrors = checkForFlowErrors;
