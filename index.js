// Oddly enough, this statement returns an executable path to the flow binary:
var flowBinPath = require('flow-bin');
var when = require('when');


module.exports = function(grunt) {

  grunt.registerMultiTask('flowbin', 'Facebook\'s Flow static type checking', function() {
    var done = this.async();
    var target = this.target;
    var data = this.data;
    var args = this.args;
    var command;

    grunt.verbose.ok('executing target: ' + target);

    var command = availableCommands[target];
    var promisedCommand;

    if (!command) {
      promisedCommand = when.promise(function() {
        throw new Error('Unsupported target: ' + target);
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


function checkForFlowErrors(grunt, cmd, options) {
  var magicStatuses = {
    flowError: 2,  // a Flow error in some files
  }
  var cmdOpts = makeOptions(options, {
    color: 'always',
  })

  return flow(grunt, [cmd].concat(cmdOpts), {
      validStatuses: [
        0,
        magicStatuses.flowError,
      ],
    })
    .then(function(result) {
      grunt.log.writeln(result.stdout || result.stderr);
    });
}


function flow(grunt, args, opt) {
  opt = opt || {};
  opt.validStatuses = opt.validStatuses || [0];

  return when.promise(function(resolve) {
    var config = {
      cmd: flowBinPath,
      args: args,
    };
    grunt.verbose.ok('spawning command:', config, opt);

    grunt.util.spawn(config, function(error, result, code) {
      grunt.verbose.ok('spawned command result:', error, result, code);

      if (opt.validStatuses.indexOf(code) === -1) {
        throw new Error(config.cmd + ' exited ' + code + '; result: ' + result);
      }

      resolve(result);
    });
  });
}


function makeOptions(optionData, defaults) {
  optionData = Object.assign({}, defaults, optionData);
  var options = [];

  Object.keys(optionData).forEach(function(key) {
    options.push('--' + key + '=' + optionData[key]);
  });

  return options;
}
