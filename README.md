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

Releasy currently supports both NodeJS' package.json and .NET C#'s AssemblyInfo.cs. The default file used is `package.json`, but you may specify a different value though the options file or in the command line.

### JSON files

If the specified file has a `.json` extension, it will be treated as Node's `package.json`. This means that the version will be read from and written to your package's `version` field.

### C# files

If the specified file has a `.cs` extension, it will be treated as an `AssemblyInfo.cs` file. As such, the version will be read from and written to assembly version attributes, which are: [`AssemblyVersion`](http://msdn.microsoft.com/en-us/library/system.reflection.assemblyversionattribute(v=vs.110).aspx), [`AssemblyFileVersion`](http://msdn.microsoft.com/en-us/library/system.reflection.assemblyfileversionattribute(v=vs.110).aspx) and [`AssemblyInformationalVersion`](http://msdn.microsoft.com/en-us/library/system.reflection.assemblyinformationalversionattribute(v=vs.110).aspx).

In order to conform to the .NET Framework's specification, only the `AssemblyInformationalVersion` attribute will retain any prerelease version information, while the other two will be stripped of it, keeping only the version numbers.