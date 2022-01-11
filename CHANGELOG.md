# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.13.1] - 2022-01-11
### Changed
- Removed `shelljs` dependency.

## [1.13.0] - 2022-01-04
### Added
- Support for links in changelog files.

## [1.12.1] - 2022-01-03

## [1.12.0] - 2020-11-04
### Added
- `display-name` option to the release message.
 
## [1.11.1] - 2020-08-26
### Fixed
- `camelcase` package require.

## [1.11.0] - 2020-08-12
### Added
- Flag `--otp` to handle NPM two-factor authentication.

### Fixed
- Error when trying to push an inexistent tag (with `releasy --no-tag`).

## [1.10.5] - 2020-08-10
### Changed
- Remove `q` promise library in favor of native `Promise` object.

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

[Unreleased]: https://github.com/vtex/releasy/compare/v1.13.1...HEAD
[1.13.1]: https://github.com/vtex/releasy/compare/v1.13.0...v1.13.1
[1.13.0]: https://github.com/vtex/releasy/compare/v1.12.1...v1.13.0
[1.12.1]: https://github.com/vtex/releasy/compare/v1.12.0...v1.12.1
[1.12.0]: https://github.com/vtex/releasy/compare/v1.11.1...v1.12.0
[1.11.1]: https://github.com/vtex/releasy/compare/v1.11.0...v1.11.1
[1.11.0]: https://github.com/vtex/releasy/compare/v1.10.5...v1.11.0
[1.10.5]: https://github.com/vtex/releasy/compare/v1.10.4...v1.10.5
[1.10.4]: https://github.com/vtex/releasy/compare/v1.10.3...v1.10.4
[1.10.3]: https://github.com/vtex/releasy/compare/v1.10.2...v1.10.3
[1.10.2]: https://github.com/vtex/releasy/compare/v1.10.1...v1.10.2
[1.10.1]: https://github.com/vtex/releasy/compare/v1.10.0...v1.10.1
[1.10.0]: https://github.com/vtex/releasy/compare/v1.9.1...v1.10.0
[1.9.1]: https://github.com/vtex/releasy/compare/v1.9.0...v1.9.1
[1.9.0]: https://github.com/vtex/releasy/compare/v1.8.2...v1.9.0
[1.8.2]: https://github.com/vtex/releasy/compare/v1.8.1...v1.8.2
[1.8.1]: https://github.com/vtex/releasy/compare/v1.8.0...v1.8.1
[1.8.0]: https://github.com/vtex/releasy/compare/v1.7.3...v1.8.0
