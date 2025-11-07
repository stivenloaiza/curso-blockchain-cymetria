# 🔁⚙️ Sesión 3 — Transacciones y mecanismos de consenso

## Objetivo
Aprender a construir y enviar transacciones en diferentes redes.

## Subtemas
- Estructura interna de una transacción.
- Nonce, gas, fees, firma digital.
- Cómo se propaga una transacción.
- Mecanismos de consenso: PoW, PoS, PoA.

## Práctica
- Enviar una transacción en Javascript
- Analizar fallos comunes (gas insuficiente, firma inválida).
- Buscador RPC: https://chainlist.org/chain/11155111

Material complementario:

- Ethereum Docs — Transactions (estructura, firma, nonce): https://ethereum.org/en/developers/docs/transactions/
- Ethereum Docs — Gas and fees (gas, base fee, priority tip, EIP-1559): https://ethereum.org/en/developers/docs/gas/
- EIP-1559 — Fee market change for Ethereum: https://eips.ethereum.org/EIPS/eip-1559
- EIP-155 — Replay protection y `chainId` en firmas: https://eips.ethereum.org/EIPS/eip-155
- ethers.js v6 — Enviar transacciones con `Wallet.sendTransaction`: https://docs.ethers.org/v6/api/wallet/#Wallet-sendTransaction
- web3.js — `web3.eth.sendTransaction` (JS): https://web3js.readthedocs.io/en/v1.10.0/web3-eth.html#sendtransaction
- Geth (Go‑Ethereum) — Transaction Pool (mempool y propagación): https://geth.ethereum.org/docs/developers/txpool
- Mastering Ethereum (libro abierto) — Cap. Transacciones y Gas: https://github.com/ethereumbook/ethereumbook/blob/develop/06transactions.asciidoc
- Ethereum Docs — Proof of Stake (PoS): https://ethereum.org/en/developers/docs/consensus-mechanisms/pos/
- Geth — Clique Proof‑of‑Authority (PoA): https://geth.ethereum.org/docs/consensus/clique
- Hyperledger Besu — IBFT 2.0 (PoA tolerante a fallos bizantinos): https://hyperledger.github.io/besu/latest/Concepts/Consensus/IBFT/
- Bitcoin Developer Guide — Transactions (modelo UTXO, mempool, propagación y PoW): https://developer.bitcoin.org/devguide/transactions.html
- MetaMask Support — Errores comunes de transacción (gas insuficiente, firma inválida): https://support.metamask.io/hc/en-us/articles/4403988477969-How-to-fix-common-transaction-errors
- Infura Blog — Ciclo de vida de una transacción en Ethereum (referencia reconocida): https://www.infura.io/blog/ethereum-transaction-lifecycle

---

Navegación: [⬅️ Sesión 2](../sesion-02/README.md) · [Siguiente ➡️ Sesión 4](../sesion-04/README.md)
