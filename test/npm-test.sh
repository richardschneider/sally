#!/bin/bash
set -ev
pkg=$(npm pack)
ls $pkg
mkdir -p ../tmp
cd ../tmp
npm install ../sally/$pkg
./node_modules/.bin/sally --help
