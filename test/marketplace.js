var Marketplace = artifacts.require("./Marketplace.sol");
// var Pausable = artifacts.require("./Pausable.sol");


contract('Marketplace', function(accounts) {

  it("On deploy, add the owner of the contract to administrators", function() {
  	return Marketplace.deployed().then(function(instance) {
  		assert(instance.checkAdmin(accounts[0]), true);
  	});
  });

  it("On deploy, do not add an account other than the owner of the contract to administrators", function() {
  	return Marketplace.deployed().then(function(instance) {
  		assert(instance.checkAdmin(accounts[1]), false);
  	});
  });

  it("An admin account can add an account as an admin", function() {
  	return Marketplace.deployed().then(function(instance) {
  		marketplaceInstance = instance;
  		admin = accounts[0];
  		futureAdmin = accounts[1];
  		return marketplaceInstance.addAdmin(futureAdmin, {from: admin});
  	}).then(function() {
  		assert(marketplaceInstance.checkAdmin(futureAdmin), true);
  	});
  });

  it("Should not let a non-admin account add an admin", function() {
  	return Marketplace.deployed().then(function(instance) {
  		marketplaceInstance = instance;
  		nonAdmin = accounts[1];
  		return marketplaceInstance.addAdmin(nonAdmin, {from: nonAdmin});
  	}).then(function() {
  		assert(marketplaceInstance.checkAdmin(nonAdmin), false);
  	});
  });

   it("An owner account should be able to remove an admin", function() {
  	return Marketplace.deployed().then(function(instance) {
  		marketplaceInstance = instance;
  		owner = accounts[0];
  		return marketplaceInstance.addAdmin(accounts[1], {from: owner});
  	}).then(function() {
  		assert(marketplaceInstance.checkAdmin(accounts[1]), true);
  	}).then(function() {
  		return marketplaceInstance.removeAdmin(accounts[1], {from: owner});
  	}).then(function() {
  		assert(marketplaceInstance.checkAdmin(accounts[1]), false);
  	});
  });

  it("Allow anyone to request to be a store owner", function() {
    return Marketplace.deployed().then(function(instance) {
      marketplaceInstance = instance;
      requester = accounts[1];
      marketplaceInstance.requestStoreOwnerStatus({from: requester});
    }).then(function() {
      assert(marketplaceInstance.getRequestedStoreOwnersLength(), 1);
      assert(marketplaceInstance.getRequestedStoreOwner(0), requester);
    });
  });


  it("Admins can approve store owners", function() {
    return Marketplace.deployed().then(function(instance) {
      marketplaceInstance = instance;
      admin = accounts[0];
      marketplaceInstance.approveStoreOwnerStatus(accounts[1], {from: admin});
      assert(marketplaceInstance.checkStoreOwnerStatus(accounts[1]), true);
    });
  });

  it("Non-admins should not be able to approve store owners", async () => {
    let marketplaceInstance = await Marketplace.deployed();
    try {
      await marketplaceInstance.approveStoreOwnerStatus(accounts[1], {from: accounts[2]});
      assert.fail('Should have reverted before');
    } catch(error) {

      //assert.equal(error.message, "VM Exception while processing transaction: revert");

      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");

    }
  });

  it("Admins can remove store owners", function() {
    return Marketplace.deployed().then(function(instance) {
      marketplaceInstance = instance;
      admin = accounts[0];
      marketplaceInstance.approveStoreOwnerStatus(accounts[1], {from: admin});
      marketplaceInstance.removeStoreOwnerStatus(accounts[1], {from: admin});
      assert(marketplaceInstance.checkStoreOwnerStatus(accounts[1]), false);
    });
  });

  it("Should not allow non-admins to remove store owners", async () => {
    let marketplaceInstance = await Marketplace.deployed();
    admin = accounts[0];
    nonAdmin = accounts[2];
    await marketplaceInstance.approveStoreOwnerStatus(accounts[1], {from: admin});
    try {
      await marketplaceInstance.removeStoreOwnerStatus(accounts[1], {from: nonAdmin});
      assert.fail('Should have reverted before');
    } catch(error) {
      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
    }
  });

  it("Allow owners to pause the contract", async () => {
    let MarketplaceInstance = await Marketplace.new();
    await MarketplaceInstance.pause({from: accounts[0]})
  //  let PausableInstance = await Pausable.deployed();
    assert(MarketplaceInstance.paused, true);
  });

  it("Do not allow calling whenNotPaused functions if contract is already paused", async () => {
    let MarketplaceInstance = await Marketplace.new();
    await MarketplaceInstance.pause({from: accounts[0]})
    try {
      await MarketplaceInstance.addAdmin(accounts[1], {from: accounts[0]});
      assert.fail('Should have reverted before');
    } catch(error) {
      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
    }
  });

  it("Allow owners to unpause the contract", async () => {
    let MarketplaceInstance = await Marketplace.new();
    await MarketplaceInstance.pause({from: accounts[0]})
    await MarketplaceInstance.unpause({from: accounts[0]})
    await MarketplaceInstance.addAdmin(accounts[1], {from: accounts[0]});

  //  let PausableInstance = await Pausable.deployed();

  assert(MarketplaceInstance.paused, false);

    assert(marketplaceInstance.checkAdmin(accounts[1]), true);
  });

  it("Allow the owner to destroy the contract", async () => {
    let MarketplaceInstance = await Marketplace.new();
    await MarketplaceInstance.close({from: accounts[0]});
    let code = await web3.eth.getCode(MarketplaceInstance.address)
    assert.equal(code, "0x0");
  });

  it("A non-owner cannot destroy the contract", async () => {
    let MarketplaceInstance = await Marketplace.new();
    try {
      await MarketplaceInstance.close({from: accounts[1]});
      assert.fail('Should have reverted before');
    } catch(error) {
      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
    }
  });
});
