# Releasy

Releasy helps you release versions of your node package.json easily!

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