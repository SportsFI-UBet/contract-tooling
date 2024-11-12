#!/bin/bash

set -eu

anvil &

# generated from mnemonic: "test test test test test test test test test test test junk"
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ADDRESS=0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266

forge build

forge script \
    --rpc-url http://localhost:8545 \
    --private-key ${PRIVATE_KEY} \
    --sender ${ADDRESS} \
    -vvvv --broadcast --ffi \
    $@

# Keep anvil running
wait
