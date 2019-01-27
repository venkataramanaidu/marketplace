pragma solidity >0.4.99 <0.6.0;

/**
 * The Ownable contract has an owner address, and provides basic authorization control
 * functions to implement permissions
 */

contract Ownable {
  address  payable public owner;

/**
 * Event to indicate the transfer of Ownership
 */

  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * Constructor sets the original `owner` of the contract to the sender
   * account.
   */
   constructor() internal {
    owner = msg.sender;
  }

  /**
   *  Restricts the operation to the owner.
   */
  modifier onlyOwner() {
    require(msg.sender == owner);
    _;
  }


  /**
   *    Allows the current owner to transfer control of the contract to a newOwner.
   *    newOwner Is the address to transfer ownership to.
   */
  function transferOwnership(address payable newOwner) onlyOwner public {
    require(newOwner != address(0));
    emit OwnershipTransferred(owner, newOwner);
    owner = newOwner;
  }

}


/**
 *
 *   Pausable contract which allows children to implement an emergency pause mechanism.
 */

contract Pausable is Ownable {
  event Pause();
  event Unpause();

  bool public paused = false;


  /**
   *    Modifier allows a function to be callable only when the contract is not paused.
   */
  modifier whenNotPaused() {
    require(!paused);
    _;
  }

  /**
   *    Modifier to make a function callable only when the contract is paused.
   */
  modifier whenPaused() {
    require(paused);
    _;
  }

  /**
   *    called by the owner to pause, triggers stopped state
   */
  function pause() onlyOwner whenNotPaused public {
    paused = true;
    emit Pause();
  }

  /**
   *    called by the owner to unpause, returns to normal state
   */
  function unpause() onlyOwner whenPaused public {
    paused = false;
    emit Unpause();
  }
}


/**
 *    Contract that can be closed by the owner. All funds in contract will be sent to the owner.
 */
contract mortal is Ownable {

   constructor() payable internal{ }

  /**
   *    Transfers the current balance to the owner and kills the contract.
   */
  function close() onlyOwner public {
    selfdestruct (owner) ;
  }

  function closeAndSend(address payable _recipient) onlyOwner public {
    selfdestruct(_recipient);
  }
}


/*
*  Marketplace contract allows the addition and removal of admins and storefront owners
*/

contract Marketplace is Ownable, mortal , Pausable {

	/**    Account deploying the contract is made the admin and can add other accounts as admin
	*/
	constructor() public {
		administrators[msg.sender] = true;
	}

	/**  the mappings store current administrators and storeowners
	*    The array stores address of to-be-approved storeowners.
	*/
	mapping (address => bool) private administrators;
	mapping (address => bool) private storeOwners;
	address[] private requestedStoreOwners;

	// Events emmited by the contract
	event AdminAdded (address adminAddress);
	event AdminRemoved (address removedAddress);
	event StoreOwnerRequest (address requester);
	event StoreOwnerAdded (address storeOwnerAddress);
	event StoreOwnerRemoved (address storeOwnerAddress);

	//    modifier to restrict function calls to administrators
	modifier onlyAdmin() {
		require(administrators[msg.sender] == true);
		_;
	}

	/**    Adds an administrator. Admins can add more administrators.
	* @param admin Address to add as administrator
	*/
	function addAdmin(address admin)
	onlyAdmin
	whenNotPaused
	public {
		administrators[admin] = true;
		emit AdminAdded(admin);
	}

	/**    Remove an administrator. Only owners can remove administrators.
	*      admin Address to remove as administrator
	*/
	function removeAdmin(address admin)
	onlyOwner
	whenNotPaused
	public {
		require(administrators[admin] == true);
		administrators[admin] = false;
		emit AdminRemoved(admin);
	}

	/**    Checks if address is an administrator.
	*      admin Address to remove as administrator
	*      return True if address is admin. False otherwise.
	*/
	function checkAdmin(address admin)
	view
	public
	returns (bool) {
		return administrators[admin];
	}

	/*
   * Adds msg.sender to requestedStoreOwners array
   */

	function requestStoreOwnerStatus()
	whenNotPaused
	public {
		require(storeOwners[msg.sender] == false);
		requestedStoreOwners.push(msg.sender);
		emit StoreOwnerRequest(msg.sender);
	}

	/**    Returns the length of the requestedStoreOwners array.
	*      Because there is no way to clear the array as of now,
	*      the length will include requesters who have already been approved.
	*
	* @return Length of the requestedStoreOwners
	*/
	function getRequestedStoreOwnersLength()
	view
	public
	returns (uint) {
		return requestedStoreOwners.length;
	}


	/**    Returns the address at position index in requestedStoreOwners
	*      index Position in requestedStoreOwners
	*      return Address at position index in requestedStoreOwners
	*/
	function getRequestedStoreOwner(uint index)
	view
	public
	returns (address) {
		return requestedStoreOwners[index];
	}

	/**    Marks an address as a storeowner
	* @param requester The address to add as a storeowner
	*/
	function approveStoreOwnerStatus(address requester)
	onlyAdmin
	whenNotPaused
	public {
		storeOwners[requester] = true;
		emit StoreOwnerAdded(requester);
	}

	/**    Removes an address its storeowner status
	*      storeOwner The address to remove as a storeowner
	*/
	function removeStoreOwnerStatus(address storeOwner)
	onlyAdmin
	whenNotPaused
	public {
		storeOwners[storeOwner] = false;
		emit StoreOwnerRemoved(storeOwner);
	}

	/**Checks if an address has storeowner status
	*  storeOwner for which to check the status
	*  return True if the address is a storeowner. False otherwise.
	*/
	function checkStoreOwnerStatus(address storeOwner)
	view
	public
	returns (bool) {
		return storeOwners[storeOwner];
	}
}
