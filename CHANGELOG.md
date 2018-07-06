# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Changed
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
