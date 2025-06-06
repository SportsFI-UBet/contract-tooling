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

# formatter is specified to avoid spam discord invite...
# See https://github.com/protofire/solhint/blob/bea42ef8e2518b607f10b7b18e2f7747816d149c/solhint.js#L322
bun run solhint --formatter stylish ./{contracts,script,test}/*.sol ./{contracts,script,test}/**/*.sol

function filterOutSmallContracts() {
    # Only show large contracts, larger than 5 kb
    sed -e 's/,//g' | awk -F ' *\\| *' 'NR < 6 || $3 > 5000'
}

SIZE_REPORT=reports/contract-size-report.md
echo -e "## Contract size report\n" > ${SIZE_REPORT}
FOUNDRY_PROFILE=default forge build --sizes | filterOutSmallContracts | tee -a ${SIZE_REPORT}
