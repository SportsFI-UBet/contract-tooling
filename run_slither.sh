#!/bin/bash
set -eu

USAGE="Run slither analysis on contracts using forge

USAGE:
${0} [<extra slither options>...]
"

THIS_DIR=$(dirname ${BASH_SOURCE[0]})
ROOT_DIR=$(cd ${THIS_DIR}/..; pwd)

pushd ${ROOT_DIR} >/dev/null

# clean the build because if test files were built before, they will show up in
# the build info, and break slither
forge clean

# Use lite profile for a quicker compilation, and skip tests and scripts
FOUNDRY_PROFILE=lite forge build --build-info --skip test --skip script

TEMP_OUTPUT=$(mktemp)

# slither returns non-zero return if there are any findings. We want to fail
# only when slither actually fails to run, so have to look at the error log.
# All the output ends up in stderr... so have to capture it
slither . --filter-paths 'lib/' "$@" 2>${TEMP_OUTPUT} || true
cat ${TEMP_OUTPUT}

# Check error log
if grep -Ee "(Traceback|Error(?!s\.sol))" ${TEMP_OUTPUT}; then
  echo Logs contained Error or Traceback!
  exit 1
fi
