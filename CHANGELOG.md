# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.0] - 2019-06-09
## Added
- Move dependencies to peerDependencies in order to allow for flexibility from consumers.

## [2.0.2] - 2019-06-09
## Changed
- Correctly publish files built during CI.

## [2.0.1] - 2019-06-09
## Changed
- Correctly publish js files in resulting npm package, not the typescript files.
- Include type declarations in resulting npm package.

## [2.0.0] - 2019-06-08
### Changed
- Upgrade `AWS`, `chalk`, and `winston` dependencies to latest major versions.
- Move project to a typescript project.
- Use lts/dubnium for development.

### Removed
- Delete functions that promisified the AWS API since AWS added the `.promise` functionality in latest major version.

## [1.0.4] - 2017-07-19
### Added
- Added `createOrUpdateStack` function.

## [1.0.3] - 2017-05-29
### Added
- Delaying `AWS.CloudFormation` creation.
