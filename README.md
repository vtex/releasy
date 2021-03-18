# Releasy

[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/vtex/releasy?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Releasy helps you release versions of your projects easily! It currently works with [NodeJS package.json files](#json-files) and [C# AssemblyInfo.cs files](#c-files).

Releasy will automatically do the following:

- Increment the version in the `manifest.json` or `package.json` file;
- Commit the changed version file;
- Create a Git tag with the version;
- Push the tag and changes to the Git remote;
- If exists, increment version and date in the `CHANGELOG.md`;
  - For this, you need to follow the format of CHANGELOG of [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
  - See [CHANGELOG example area](#changelog-example)
- Post the release notes from CHANGELOG on GitHub release.

## Settings

A [GitHub Personal access token](https://help.github.com/articles/creating-an-access-token-for-command-line-use/) will be needed to create the release on GitHub and with all `repo` permissions. When you created, add the token to an environment variable named `GITHUB_API_TOKEN` in your `~/.bash_profile` (for bash users) or `~/.config/fish/config.fish` (for fish users) by adding the following line at the end of the file.

```
export GITHUB_API_TOKEN=<your_token>
```

## Usage

If you want to see what happens, grab it (`npm i -g releasy`) and run anything with the **`--dry-run`** flag. This mode will only show you what would happen, without actually applying any changes. At any time, calling `releasy -h` or `releasy --help` will show you the list of options available. Try it.

The **default behavior** increments the `patch` and creates a `beta` prerelease using the `package.json` file.

```sh
$ releasy

Old version: 1.0.0
New version: 1.0.1-beta
prompt: Are you sure?:  (yes)
Starting release...
Version bumped to 1.0.1-beta
File package.json added # git add package.json
File package.json committed # git commit package.json -m "Release v1.0.1-beta"
Tag created: v1.0.1-beta #git tag v1.0.1-beta -m "Release v1.0.1-beta"
Pushed commit and tags # git push && git push --tags
All steps finished successfully.
```

You can **increment other parts** of the version by providing a first argument:

```sh
$ releasy patch # 1.2.3 => 1.2.4-beta
$ releasy minor # 1.2.3 => 1.3.0-beta
$ releasy major # 1.2.3 => 2.0.0-beta
$ releasy prerelease # 1.2.3-beta.4 => 1.2.3-beta.5
$ releasy pre # is an alias to 'prerelease'
```

When you are ready to **promote a beta version to stable**, use the `promote` argument:

```sh
$ releasy promote # 1.2.3-beta.4 => 1.2.3
```

Or, if you want to **increment directly as stable** version, use the `--stable` option:

```sh
$ releasy --stable # 1.2.3 => 1.2.4
```

To apply a **custom prerelease identifier**:

```sh
$ releasy --tag-name alpha # 1.2.3 => 1.2.4-alpha
```

If you want to **post the release notes on GitHub**, use the `--notes` option:

```sh
$ releasy --stable --notes # Release Notes submitted
```

If you want to prevent releasy from automatically **committing, tagging or pushing**, use the `--no-commit`/`--no-tag`/`--no-push` options:

```sh
$ releasy --stable --no-tag --no-push
```

## Options file

You **may** create a file called `_releasy.yaml` to any values set in this file will be used as default. If you prefer, `.yml` and `.json` extensions will also work. Below is a sample `_releasy.yaml` file.

```yaml
# https://github.com/vtex/releasy
type: prerelease # prerelease as default increment
filename: otherpackage.json # different version file as default

# you may also use any other options available on the command line
stable: true # release stable version
tag: alpha # use alpha as prerelease name
dry-run: true # always use dry-run mode

no-tag: true # don't tag the release commit
no-push: true # don't push to the remote repository
no-commit: true # don't create the release commit
display-name: true # add the project name to the tag and release commit
# etc
```

## Different version files

Releasy currently supports both NodeJS' package.json and .NET C#'s AssemblyInfo.cs. The default file used is `package.json`, but you may specify a different value through the options file or in the command line.

### JSON files

If the specified file has a `.json` extension, it will be treated as Node's `package.json`. This means that the version will be read from and written to your package's `version` field.

### C# files

If the specified file has a `.cs` extension, it will be treated as an `AssemblyInfo.cs` file. As such, the version will be read from and written to assembly version attributes, which are: [`AssemblyVersion`](<http://msdn.microsoft.com/en-us/library/system.reflection.assemblyversionattribute(v=vs.110).aspx>), [`AssemblyFileVersion`](<http://msdn.microsoft.com/en-us/library/system.reflection.assemblyfileversionattribute(v=vs.110).aspx>) and [`AssemblyInformationalVersion`](<http://msdn.microsoft.com/en-us/library/system.reflection.assemblyinformationalversionattribute(v=vs.110).aspx>).

To conform to the .NET Framework's specification, only the `AssemblyInformationalVersion` attribute will retain any prerelease version information, while the other two will be stripped of it, keeping just the version numbers.

### CHANGELOG example

The format of your changelog is according to [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) that requires an `## [Unreleased]` section for the next release, and the types of changes below this section.

An example of a first CHANGELOG.md to create before using a `releasy` command:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- My new feature

### Fixed

- An bug
```
