#!/bin/bash
set -eu

USAGE="Run forge tests

USAGE:
${0} [<extra forge test options>...]
"

# Use lite profile for a quicker compilation
# Default foundry profile to lite unless already specified in environment
export FOUNDRY_PROFILE=${FOUNDRY_PROFILE:-lite}

# --ffi for using Upgrade Scripts solidity deployment lib
forge test --ffi -vv $@
