// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev EIP-1167 minimal proxy layout matches OpenZeppelin Clones v5 (overlapping address packing).
library Create2Deployer {
    function deploy(bytes32 salt, bytes memory bytecode) internal returns (address deployed) {
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
        require(deployed != address(0), "Create2Failed");
    }

    function deployClone(bytes32 salt, address implementation) internal returns (address deployed) {
        assembly {
            mstore(0x00, or(shr(0xe8, shl(0x60, implementation)), 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000))
            mstore(0x20, or(shl(0x78, implementation), 0x5af43d82803e903d91602b57fd5bf3))
            deployed := create2(0, 0x09, 0x37, salt)
        }
        require(deployed != address(0), "Create2Failed");
    }

    function computeAddress(bytes32 salt, bytes32 bytecodeHash, address deployer)
        internal
        pure
        returns (address predicted)
    {
        predicted = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(bytes1(0xff), deployer, salt, bytecodeHash)
                    )
                )
            )
        );
    }

    function cloneHash(address implementation) internal pure returns (bytes32 hash) {
        assembly {
            let ptr := mload(0x40)
            mstore(add(ptr, 0x24), 0x5af43d82803e903d91602b57fd5bf3ff)
            mstore(add(ptr, 0x14), implementation)
            mstore(ptr, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73)
            hash := keccak256(add(ptr, 0x0c), 0x37)
        }
    }

    function cloneBytecode(address implementation) internal pure returns (bytes memory bytecode) {
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d3d373d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }
}
