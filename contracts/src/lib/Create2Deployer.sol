// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

library Create2Deployer {
    function deploy(bytes32 salt, bytes memory bytecode) internal returns (address deployed) {
        assembly {
            deployed := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
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

    function cloneBytecode(address implementation) internal pure returns (bytes memory) {
        return abi.encodePacked(
            hex"3d602d80600a3d3981f3363d573d3d3d363d73",
            implementation,
            hex"5af43d82803e903d91602b57fd5bf3"
        );
    }

    function cloneHash(address implementation) internal pure returns (bytes32) {
        return keccak256(cloneBytecode(implementation));
    }
}
