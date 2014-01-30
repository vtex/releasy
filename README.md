# Releasy

Releasy helps you release versions of your projects easily!

### Usage:

To simply release a beta patch:

    $ releasy

    Old version: 1.0.0
    New version: 1.0.1-beta
    prompt: Are you sure?:  (yes)
    Starting release...
    Version bumped to 1.0.1-beta
    package.json added
    package.json committed
    New git tag created: v1.0.1-beta
    pushed commit and tags to remote
    All steps finished successfuly.

To release a stable patch:

    $ releasy --stable

    Old version: 1.0.0
    New version: 1.0.1


To release major, minor or patch, you can say it in the first argument:

    $ releasy major

    Old version: 1.0.0
    New version: 2.0.0-beta


To promote a beta to stable, say 'promote':

    $ releasy promote

    Old version: 1.0.0-beta
    New version: 1.0.0

To release a custom patch:

    $ releasy --tag alpha

    Old version: 1.0.0
    New version: 1.0.1-alpha

To see what would happen and not do anything (dry run) simply:

    $ releasy --dry-run

    Old version: 1.0.0
    New version: 1.0.1-beta

To run silently, use `-s`:

    $ releasy -s

    Old version: 1.0.0
    New version: 1.0.1-beta

## Options file

You **may** create a file called `_releasy.yaml` so that any values set in this file will be used as default. If you prefer, `.yml` and `.json` extensions will also work. Below is a sample `_releasy.yaml` file.

```yaml
# https://github.com/vtex/releasy
type: prerelease                # prerelease as default increment
filename: otherpackage.json     # different version file as default

# you may also use any other options available in the command line
stable: true        # release stable version
tag: alpha          # use alpha as prerelease name
dry-run: true       # always use dry run mode
# etc
```


## Different version files

Releasy supports both NodeJS' package.json and .NET C#'s AssemblyInfo.cs.

The default behavior looks for a `package.json` file:

    $ releasy		# uses package.json

A different AssemblyInfo or package.json can be specified:

    $ releasy --filename anotherfile.json
		# or
	$ releasy --filename MyAssemblyInfo.cs

If the default `package.json` file is not found, `src/ProductAssemblyInfo.cs` is used as fallback:

	# granted package.json doesn't exist
	$ releasy		# uses src/ProductAssemblyInfo.cs

If your `package.json` has a field named `assemblyInfo`, it will be used to point to the AssemblyInfo file:

```json
{
  "assemblyInfo": "OtherAssemblyInfo.cs"
}
```
	# given the package.json above
	$ releasy		# uses OterAssemblyInfo.cs