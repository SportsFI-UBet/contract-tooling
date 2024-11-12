#!/bin/bash
set -euo pipefail

USAGE="Run OZ upgradability linter, solhint, forge size analysis

USAGE:
${0}
"

THIS_DIR=$(dirname ${BASH_SOURCE[0]})
ROOT_DIR=$(cd ${THIS_DIR}/..; pwd)

pushd ${ROOT_DIR} >/dev/null
mkdir -p reports

forge clean
FOUNDRY_PROFILE=lite forge build --build-info

bun run solhint ./{contracts,script,test}/**/*.sol

function filterOutSmallContracts() {
    # Only show large contracts, larger than 15 kb
    awk -F ' *\\| *' 'NR < 6 || $3 > 15'
}

SIZE_REPORT=reports/contract-size-report.md
echo -e "## Contract size report\n" > ${SIZE_REPORT}
FOUNDRY_PROFILE=default forge build --sizes | filterOutSmallContracts | tee -a ${SIZE_REPORT}
