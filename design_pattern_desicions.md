# Design Pattern Decisions

## Circuit Breaker

The contract owner (i.e. the address that has deployed the contract) can therefore pause any of them.
When paused, all methods that cause changes in the administrators, storefronts, products or, most importantly, balances, cannot be used.


The pausable functions have the `whenNotPaused` modifier.

## Fail early and fail loud
Used `require` to handle errors with state-reverting exceptions in the following modifiers and functions:

#### Marketplace.sol
- onlyAdmin()
- removeAdmin(address admin)
- requestStoreOwnerStatus()

#### Stores.sol
- onlyStoreOwner()
- onlyStorefrontOwner(bytes32 id)
- withdrawStorefrontBalance(bytes32 storefrontId)
- purchaseProduct(bytes32 storefrontId, bytes32 productId, uint qty)

## Restricting Access
The following modifiers restrict access to certain functions:

#### Marketplace.sol
- onlyAdmin()

#### Stores.sol
- onlyStoreOwner()
- onlyStorefrontOwner(bytes32 id)


## Mortal
Both `Marketplace.sol` and `Stores.sol` inherit Mortal contract and hence are mortal.

## Pull over Push Payments

The `payable` function in `Stores.sol` is `purchaseProduct`. This function does not transfer funds to the `storeOwner` directly, but increments the storefront's `balance`. Withdrawals can then be done via the `withdrawStorefrontBalance` method. Both these functions are also pausable with the `whenNotPaused` modifier.
