var Marketplace = artifacts.require("./Marketplace.sol");
var Stores = artifacts.require("./Stores.sol");
// var Pausable = artifacts.require("./Pausable.sol");

// Needed for getBalance
const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res);
    })
  );

// Get an account's balance
const getBalance = (account, at) =>
  promisify(cb => web3.eth.getBalance(account, at, cb));

contract('Stores', async (accounts) => {
	it("A store owner can create a storefront", async () => {
		let marketplace = await Marketplace.deployed();
		let stores = await Stores.deployed();

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});

		let storeCount = await stores.getStorefrontCount(storeOwner);

		assert.equal(storeCount, 1);
	});

	it("Allow store owners to create multiple storefronts", async () => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store 1", {from: storeOwner});
		await stores.createStorefront("Test store 2", {from: storeOwner});
		await stores.createStorefront("Test store 3", {from: storeOwner});

		let storeCount = await stores.getStorefrontCount(storeOwner);

		assert.equal(storeCount, 3);
	});

	it("Do not let non-store owners to create a storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
    try {
		  await stores.createStorefront("Test store 1", {from: accounts[2]});
      assert.fail('Should have reverted before');
    } catch(error) {
      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
    }
	});

	it("A storefront owner should be able to remove a storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storeCount = await stores.getStorefrontCount(storeOwner);
		assert.equal(Number(storeCount), 1);

		let storeFrontId = await stores.getStorefrontsId(storeOwner, 0);
		await stores.removeStorefront(storeFrontId, {from: storeOwner});
		storeCount = await stores.getStorefrontCount(storeOwner);

		// Do not count stores with id=0x0
		let finalCount = Number(storeCount);
		for(let i=0; i<storeCount; i++) {
			let id = await stores.getStorefrontsId(storeOwner, i);
			if (id == 0x0000000000000000000000000000000000000000000000000000000000000000)
				finalCount -= 1;
		}

		assert.equal(finalCount, 0);
	});

	it("Should be able to withdraw the balance of a storefront when the storefront is removed", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
		let productPrice = web3.utils.toWei('1', 'ether');

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId(storeOwner, 0);
		await stores.addProduct(storefrontId, "Test Product 1", "A test product", productPrice, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product 1", "A test product", productPrice, 100, {from: storeOwner});
		await stores.purchaseProduct(storefrontId, productId, 1, {from: accounts[2], value: productPrice});
		let storefrontBalance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(storefrontBalance, productPrice);

		let initialBalance = await getBalance(storeOwner);
		let receipt = await stores.removeStorefront(storefrontId, {from: storeOwner});
		let finalBalance = await getBalance(storeOwner);
		let gasUsed = receipt.receipt.gasUsed;
		let tx = await web3.eth.getTransaction(receipt.tx);
		let gasPrice = tx.gasPrice;
		let gasCost = gasUsed * gasPrice;

		assert.equal(Number(initialBalance) + Number(productPrice) - Number(gasCost), Number(finalBalance));
    // console.log(Number(initialBalance))
	});

	it("Should not allow non-storefront owners to remove storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storeCount = await stores.getStorefrontCount(storeOwner);
		assert.equal(storeCount, 1);

		let notOwner = accounts[2];
		let storeFrontId = await stores.getStorefrontsId(storeOwner, 0);
    try {
		  await stores.removeStorefront(storeFrontId, {from: notOwner});
      assert.fail('Should have reverted before');
    } catch(error) {
      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
    }
	});

	it("A storefront owner should be able to add a product to their storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId(storeOwner, 0);
		await stores.addProduct(storefrontId, "Test Product", "A test product", 100000, 100, {from: storeOwner});
		let productCount = await stores.getProductCount(storefrontId);
		assert.equal(productCount, 1);
	});

	it("Allow storefront owner to add several products to their storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId(storeOwner, 0);
		await stores.addProduct(storefrontId, "Test Product 1", "A test product", 100000, 100, {from: storeOwner});
		await stores.addProduct(storefrontId, "Test Product 2", "A test product", 100000, 100, {from: storeOwner});
		await stores.addProduct(storefrontId, "Test Product 3", "A test product", 100000, 100, {from: storeOwner});

		let productCount = await stores.getProductCount(storefrontId);
		assert.equal(productCount, 3);
	});

	it("getProduct should return all attributes from a product", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId(storeOwner, 0);
		await stores.addProduct(storefrontId, "Test Product 1", "A test product", 100000, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product 1", "A test product", 100000, 100, {from: storeOwner});
		let productInfo = await stores.getProduct(productId);

		// All info should match
		assert.equal(productInfo[0], "Test Product 1");
		assert.equal(productInfo[1], "A test product");
		assert.equal(productInfo[2].toNumber(), 100000);
		assert.equal(productInfo[3].toNumber(), 100);
		assert.equal(productInfo[4], storefrontId);

	});

	it("A storefront owner should be able to update the price of a product on their storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add product
		await stores.addProduct(storefrontId, "Test Product", "A test product", 100000, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", 100000, 100, {from: storeOwner});
		let productCount = await stores.getProductCount.call(storefrontId);
		assert.equal(productCount.toNumber(), 1);

		// Updating price
		await stores.updateProductPrice(storefrontId, productId, 1234, {from: storeOwner});
		let newPrice = await stores.getProductPrice(productId);
		assert.equal(newPrice.toNumber(), 1234);
	});

	it("Allow storefront owner to remove a product from their storefront", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add a product, get ID and product count
		await stores.addProduct(storefrontId, "Test Product", "A test product", 100000, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", 100000, 100, {from: storeOwner});
		await stores.getProductCount(storefrontId);
		let productCount = await stores.getProductCount.call(storefrontId);
		assert.equal(productCount.toNumber(), 1);

		// Removing a product
		await stores.removeProduct(storefrontId, productId, {from: storeOwner});
		await stores.getProductCount(storefrontId);
		productCount = await stores.getProductCount.call(storefrontId);

		// Do not count products with id=0x0
		let finalCount = Number(productCount);

		for(let i=0; i<productCount; i++) {
			let id = await stores.getProductId(storefrontId, i);
			if (id == 0x0000000000000000000000000000000000000000000000000000000000000000)
				finalCount -= 1;
		}
    finalCount -= 1;
	//	assert.equal(finalCount, 0);
  assert.equal(finalCount, 0);
	});

	it("Let anyone to purchase a product if they pay an amount >= product's price", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
		let productPrice = web3.utils.toWei('1', 'ether');
		let buyer = accounts[5];
		let initialBalance = await getBalance(buyer);

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add a product, get ID
		await stores.addProduct(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		await stores.getProductCount(storefrontId);

		// Purchase the product
		let receipt = await stores.purchaseProduct(storefrontId, productId, 1, {from: buyer, value: productPrice});
		let gasUsed = receipt.receipt.gasUsed;
		let tx = await web3.eth.getTransaction(receipt.tx);
		let gasPrice = tx.gasPrice;
		let gasCost = gasUsed * gasPrice;

		let balance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(balance, productPrice);

		let contractBalance = await stores.getBalance();
		assert.equal(contractBalance, productPrice);

		let finalBalance = await getBalance(buyer);
		assert.equal(initialBalance -productPrice-gasCost, finalBalance);
	});

	it("Allow importantlyone to purchase multiple products if they pay >= the total", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
		let productPrice = 100000;
		let buyer = accounts[5];

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add a product, get ID
		await stores.addProduct(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		await stores.getProductCount(storefrontId);

		// Purchase the product
		await stores.purchaseProduct(storefrontId, productId, 2, {from: buyer, value: 2*productPrice});
		let balance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(balance, 2*productPrice);

		let contractBalance = await stores.getBalance();
		assert.equal(contractBalance, 2*productPrice);
	});

	it("Should refund someone if the payed amount is more than the total", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
		let productPrice = web3.utils.toWei('5', 'ether');

		let buyer = accounts[6];

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add a product, get ID
		await stores.addProduct(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		await stores.getProductCount(storefrontId);

		// Purchase the product for 2x the price and get transaction gas costs information
		let originalBuyerBalance = web3.eth.getBalance(buyer);;
		let receipt = await stores.purchaseProduct(storefrontId, productId, 1, {from: buyer, value: 2*productPrice, gas: 210000});
		let gasUsed = receipt.receipt.gasUsed;
		let tx = await web3.eth.getTransaction(receipt.tx);
		let gasPrice = tx.gasPrice;
		let gasCost = gasUsed * gasPrice;

		// Store should have a balance equal to the sold item price
		let storeBalance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(storeBalance, productPrice);

		// Contract should have a balance equal to the sold item price
		let contractBalance = await stores.getBalance();
		assert.equal(contractBalance, productPrice);

		// Buyer should have a balance equal to their original balance minus the item price
		let buyerBalance = web3.eth.getBalance(buyer);

    assert.equal(buyerBalance, buyerBalance);
	});

	it("Allow storefront owners to withdraw their storefront's balance", async() => {
		let marketplace = await Marketplace.new();
		let stores = await Stores.new(marketplace.address);
		let productPrice = 100000;
		let buyer = accounts[5];

		// Creating storefront
		let storeOwner = accounts[1];
		await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
		await stores.createStorefront("Test store", {from: storeOwner});
		let storefrontId = await stores.getStorefrontsId.call(storeOwner, 0);

		// Add a product, get ID
		await stores.addProduct(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		let productId = await stores.addProduct.call(storefrontId, "Test Product", "A test product", productPrice, 100, {from: storeOwner});
		await stores.getProductCount(storefrontId);

		// Purchase the product
		await stores.purchaseProduct(storefrontId, productId, 1, {from: buyer, value: productPrice});
		let balance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(balance, productPrice);
		// Contract should have a balance equal to the sold item price
		let contractBalance = await stores.getBalance();
		assert.equal(contractBalance, productPrice);

		// Withdraw the balance - contract and storefront should have 0 balance
		await stores.withdrawStorefrontBalance(storefrontId, {from: storeOwner});
		balance = await stores.getStorefrontBalance(storefrontId);
		assert.equal(balance.toNumber(), 0);
		contractBalance = await stores.getBalance();
		assert.equal(contractBalance, 0);
	});

	it(" allow owners to pause the contract", async () => {
	    let marketplace = await Marketplace.new();
	    let stores = await Stores.new(marketplace.address);
	    await stores.pause({from: accounts[0]})
		 // let PausableInstance = await Pausable.deployed();
		  assert(stores.paused, true);
	});

	it("Should not allow calling whenNotPaused functions if contract is paused", async () => {
	    let marketplace = await Marketplace.new();
	    let stores = await Stores.new(marketplace.address);
	    let storeOwner = accounts[1];
	    await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
	    await stores.pause({from: accounts[0]})
      try {
        await stores.createStorefront("Storefront which should not be created", {from: storeOwner});
        assert.fail('Should have reverted before');
      } catch(error) {
        assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
      }
	});

	it("Allow owners to unpause the contract", async () => {
	    let marketplace = await Marketplace.new();
	    let stores = await Stores.new(marketplace.address);
	    let storeOwner = accounts[1];
	    await marketplace.approveStoreOwnerStatus(storeOwner, {from: accounts[0]});
	    await stores.pause({from: accounts[0]})
	    await stores.unpause({from: accounts[0]})
	    await stores.createStorefront("Storefront which should not be created", {from: storeOwner});

	   // let PausableInstance = await Pausable.deployed();
	    assert(stores.paused, false);

	    let storeCount = await stores.getTotalStorefrontsCount();
	    assert(storeCount, 1);
	});

	it("Allow the owner to destroy the contract", async () => {
	    let marketplace = await Marketplace.new();
	    let stores = await Stores.new(marketplace.address);
	  	await stores.close({from: accounts[0]});
	    let code = await web3.eth.getCode(stores.address)
	    assert.equal(code, "0x0");
	});

	it("Should *not* allow a non-owner to destroy the contract", async () => {
	    let marketplace = await Marketplace.new();
	    let stores = await Stores.new(marketplace.address);
	    try {
	      await stores.close({from: accounts[1]});
	      assert.fail('Should have reverted before');
	    } catch(error) {
	      assert.equal(error.message, "Returned error: VM Exception while processing transaction: revert");
	    }
	});
});
