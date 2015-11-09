#!/bin/bash
set -ev
pkg=$(npm pack)
ls $pkg
mkdir -p ../tmp
cd ../tmp
npm install -g ../sally/$pkg
sally --help
