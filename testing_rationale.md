# Testing Rationale 

All tests are located in `/test` and can be run using either `truffle test` with a local blockchain running, or `truffle develop`, and from the truffle console, `test`.

The goal for the tests is to validate that contracts' basic functionality works as expected.
Almost all tests were written in Javascript, though both the `Marketplace` and `Stores` contract have Solidity tests as well.

## Solidity Tests
**Files:** `TestMarketplace.sol`, `TestStores.sol`
The Solidity tests are used to check that after deploying a contract, things are setup appropriately (ex: deployer is an admin, both contracts are properly linked, etc.).

## Javascript Tests
**Files** `marketplace.js`, `stores,js`
The Javascript tests check that the contracts behave as expected.
