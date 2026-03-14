#!/bin/sh
set -e

DATADIR="/root/.ethereum"

if [ ! -d "$DATADIR/geth/chaindata" ]; then
  echo "Initializing genesis..."
  geth init --datadir "$DATADIR" /genesis.json
fi

if [ -f /nodekey ]; then
  mkdir -p "$DATADIR/geth"
  cp /nodekey "$DATADIR/geth/nodekey"
fi

exec geth "$@"
