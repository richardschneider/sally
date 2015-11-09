#!/bin/bash
set -ev
pkg=$(npm pack)
mkdir -p ../tmp
cd ../tmp
npm install -g ../sally/$pkg
