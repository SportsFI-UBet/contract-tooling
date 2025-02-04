#!/bin/bash
set -eu

USAGE="Run coverage using forge and generate an html report using lcov genhtml

USAGE:
${0} [<extra forge parameters such as -m or --match-contract>...]
"

THIS_DIR=$(dirname ${BASH_SOURCE[0]})
ROOT_DIR=$(cd ${THIS_DIR}/..; pwd)

pushd ${ROOT_DIR} >/dev/null

# Default foundry profile to lite unless already specified in environment
export FOUNDRY_PROFILE=${FOUNDRY_PROFILE:-lite}

forge build --build-info
forge coverage --ffi --report lcov $@

HTML_DIR=reports/coverage

mkdir -p reports
rm -rf ${HTML_DIR}

function filterLCOV() {
    INPUT_FILE=${1}
    FILTER=${2}
    OUTPUT_FILE=${3}

    lcov --rc lcov_branch_coverage=1 --ignore-errors empty --remove ${INPUT_FILE} "${FILTER}" -o ${OUTPUT_FILE}
}

# exclude foundry test coverage
filterLCOV lcov.info 'test*' lcov.info.filtered

# exclude foundry scripts coverage
filterLCOV lcov.info.filtered 'script*' lcov.info.filtered

# Check if filtered coverage file is empty
if [ ! -s lcov.info.filtered ]; then
    echo "No coverage data after filtering - all code was excluded. Exiting successfully."
    exit 0
fi

# generate HTML report based on lcov file
genhtml --branch-coverage --legend -o ${HTML_DIR} lcov.info.filtered

echo ${HTML_DIR}/index.html
