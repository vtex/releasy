var steps = require('./steps'),
	prompt = require('prompt');

module.exports = function(opts) {
  // Expose this to unit testing
  this.steps = steps;
  this.promise = undefined;

	var config = steps.setup(opts.filename, opts.type, opts.stable ? 'stable' : opts.tagName);
	console.log("Old version: " + config.pkg.version.bold);
	console.log("New version: " + config.newVersion.bold.yellow);

	// Pachamama v2 requires that version tags start with a 'v' character.
	config.tagName = 'v' + config.newVersion;
	config.commitMessage = 'Release ' + config.tagName;
	config.tagMessage = 'Release ' + config.tagName;
	config.npmTag = opts.npmTag;
	config.npmFolder = opts.npmFolder;
	config.dryRun = opts.dryRun;

	// No prompt necessary, release and finish.
	if (!opts.cli || opts.silent) {
    this.promise = steps.release(config, opts);
    return this;
	}

	// User wants a confirmation prompt
	prompt.start();
	var property = {
		name: 'confirm',
		type: 'string',
		description: 'Are you sure?'.green,
		default: 'yes',
		required: true,
		before: function (value) {
			return value === 'yes' || value === 'y';
		}
	};

	prompt.get(property, function (err, result) {
		if (err || !result.confirm) {
			return console.log("Cancelled by user");
		}
    steps.release(config, opts);
	});

  return this;
};