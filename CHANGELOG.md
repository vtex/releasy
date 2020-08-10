# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.10.4] - 2020-08-10
### Fixed
- Colored messages printed as `undefined`.

## [1.10.3] - 2020-08-10

## [1.10.2] - 2019-10-08

### Fixed

- `--no-...` flags and other flag default values.

## [1.10.1] - 2018-11-27

### Fixed

- Check if there is a version on the `package.json`

## [1.10.0] - 2018-07-09

### Added

- Bump version of both version files when exists.

### Changed

- Refact eslint issues.
- Make days and months always two-digit numbers.

### Fixed

- Only push the tag that's was created.

## [1.9.1] - 2018-6-19

### Changed

- Change `getGitHubRepo` to avoid the usage of `grep` and `cut` commands.

## [1.9.0] - 2018-6-18

### Added

- Add a `--notes` options to post release notes on GitHub.

## [1.8.2] - 2018-6-6

### Added

- Better explanation for the `CHANGELOG` workflow

### Fixed

- Fix parse to get repo info when clone is via SSH.

## [1.8.1] - 2018-6-4

### Fixed

- Move `github-api` lib to dependencies instead of devDependencies.

## [1.8.0] - 2018-6-1

### Added

- Update `CHANGELOG.md` when exists and post a Release Notes in github repository
