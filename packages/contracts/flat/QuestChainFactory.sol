// Sources flattened with hardhat v2.9.3 https://hardhat.org

// File @openzeppelin/contracts/utils/Context.sol@v4.6.0

// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)

pragma solidity ^0.8.0;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// File @openzeppelin/contracts/access/Ownable.sol@v4.6.0

// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)

pragma solidity ^0.8.0;

/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * By default, the owner account will be the one that deploys the contract. This
 * can later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() {
        _transferOwnership(_msgSender());
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
        _;
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// File @openzeppelin/contracts/proxy/Clones.sol@v4.6.0

// OpenZeppelin Contracts v4.4.1 (proxy/Clones.sol)

pragma solidity ^0.8.0;

/**
 * @dev https://eips.ethereum.org/EIPS/eip-1167[EIP 1167] is a standard for
 * deploying minimal proxy contracts, also known as "clones".
 *
 * > To simply and cheaply clone contract functionality in an immutable way, this standard specifies
 * > a minimal bytecode implementation that delegates all calls to a known, fixed address.
 *
 * The library includes functions to deploy a proxy using either `create` (traditional deployment) or `create2`
 * (salted deterministic deployment). It also includes functions to predict the addresses of clones deployed using the
 * deterministic method.
 *
 * _Available since v3.4._
 */
library Clones {
    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create opcode, which should never revert.
     */
    function clone(address implementation) internal returns (address instance) {
        assembly {
            let ptr := mload(0x40)
            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            instance := create(0, ptr, 0x37)
        }
        require(instance != address(0), "ERC1167: create failed");
    }

    /**
     * @dev Deploys and returns the address of a clone that mimics the behaviour of `implementation`.
     *
     * This function uses the create2 opcode and a `salt` to deterministically deploy
     * the clone. Using the same `implementation` and `salt` multiple time will revert, since
     * the clones cannot be deployed twice at the same address.
     */
    function cloneDeterministic(address implementation, bytes32 salt)
        internal
        returns (address instance)
    {
        assembly {
            let ptr := mload(0x40)
            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
            instance := create2(0, ptr, 0x37, salt)
        }
        require(instance != address(0), "ERC1167: create2 failed");
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(
        address implementation,
        bytes32 salt,
        address deployer
    ) internal pure returns (address predicted) {
        assembly {
            let ptr := mload(0x40)
            mstore(
                ptr,
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(ptr, 0x14), shl(0x60, implementation))
            mstore(
                add(ptr, 0x28),
                0x5af43d82803e903d91602b57fd5bf3ff00000000000000000000000000000000
            )
            mstore(add(ptr, 0x38), shl(0x60, deployer))
            mstore(add(ptr, 0x4c), salt)
            mstore(add(ptr, 0x6c), keccak256(ptr, 0x37))
            predicted := keccak256(add(ptr, 0x37), 0x55)
        }
    }

    /**
     * @dev Computes the address of a clone deployed using {Clones-cloneDeterministic}.
     */
    function predictDeterministicAddress(address implementation, bytes32 salt)
        internal
        view
        returns (address predicted)
    {
        return predictDeterministicAddress(implementation, salt, address(this));
    }
}

// File contracts/interfaces/IQuestChain.sol

pragma solidity ^0.8.11;

interface IQuestChain {
    enum Status {
        init,
        review,
        pass,
        fail
    }

    function init(address _owner, string calldata _details) external;

    function initWithRoles(
        address _owner,
        string calldata _details,
        address[] calldata _admins,
        address[] calldata _editors,
        address[] calldata _reviewers
    ) external;

    function edit(string calldata _details) external;

    function createQuest(string calldata _details) external;

    function editQuest(uint256 _questId, string calldata _details) external;

    function submitProof(uint256 _questId, string calldata _proof) external;

    function reviewProof(
        address _quester,
        uint256 _questId,
        bool _success,
        string calldata _details
    ) external;

    function questStatus(address _quester, uint256 _questId)
        external
        view
        returns (Status);
}

// File contracts/interfaces/IQuestChainFactory.sol

pragma solidity ^0.8.0;

interface IQuestChainFactory {
    function create(string calldata _details) external returns (address);

    function createWithRoles(
        string calldata _details,
        address[] calldata _admins,
        address[] calldata _editors,
        address[] calldata _reviewers
    ) external returns (address);

    function createDeterministic(string calldata _details, bytes32 _salt)
        external
        returns (address);

    function predictDeterministicAddress(bytes32 _salt)
        external
        returns (address);
}

// File contracts/QuestChainFactory.sol

pragma solidity ^0.8.0;

contract QuestChainFactory is IQuestChainFactory, Ownable {
    uint256 public questChainCount = 0;
    mapping(uint256 => address) private _questChains;

    event NewQuestChain(uint256 indexed index, address questChain);
    event QuestChainRootChanged(
        address indexed oldRoot,
        address indexed newRoot
    );

    address public cloneRoot;

    constructor(address _cloneRoot) {
        updateCloneRoot(_cloneRoot);
    }

    function updateCloneRoot(address _cloneRoot) public onlyOwner {
        require(
            _cloneRoot != address(0),
            "QuestChainFactory: invalid cloneRoot"
        );
        address oldRoot = cloneRoot;
        cloneRoot = _cloneRoot;
        emit QuestChainRootChanged(oldRoot, _cloneRoot);
    }

    function _newQuestChain(
        address _questChainAddress,
        string calldata _details
    ) internal {
        IQuestChain(_questChainAddress).init(_msgSender(), _details);

        _questChains[questChainCount] = _questChainAddress;
        emit NewQuestChain(questChainCount, _questChainAddress);

        questChainCount++;
    }

    function _newQuestChainWithRoles(
        address _questChainAddress,
        string calldata _details,
        address[] calldata _admins,
        address[] calldata _editors,
        address[] calldata _reviewers
    ) internal {
        IQuestChain(_questChainAddress).initWithRoles(
            _msgSender(),
            _details,
            _admins,
            _editors,
            _reviewers
        );

        _questChains[questChainCount] = _questChainAddress;
        emit NewQuestChain(questChainCount, _questChainAddress);

        questChainCount++;
    }

    function create(string calldata _details)
        external
        override
        returns (address)
    {
        address questChainAddress = Clones.clone(cloneRoot);

        _newQuestChain(questChainAddress, _details);

        return questChainAddress;
    }

    function createWithRoles(
        string calldata _details,
        address[] calldata _admins,
        address[] calldata _editors,
        address[] calldata _reviewers
    ) external override returns (address) {
        address questChainAddress = Clones.clone(cloneRoot);

        _newQuestChainWithRoles(
            questChainAddress,
            _details,
            _admins,
            _editors,
            _reviewers
        );

        return questChainAddress;
    }

    function predictDeterministicAddress(bytes32 _salt)
        external
        view
        override
        returns (address)
    {
        return Clones.predictDeterministicAddress(cloneRoot, _salt);
    }

    function createDeterministic(string calldata _details, bytes32 _salt)
        external
        override
        returns (address)
    {
        address questChainAddress = Clones.cloneDeterministic(cloneRoot, _salt);

        _newQuestChain(questChainAddress, _details);

        return questChainAddress;
    }

    function getQuestChainAddress(uint256 _index)
        public
        view
        returns (address)
    {
        return _questChains[_index];
    }
}
