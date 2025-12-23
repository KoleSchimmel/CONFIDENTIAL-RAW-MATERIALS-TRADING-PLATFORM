// SPDX-License-Identifier: BSD-3-Clause-Clear
pragma solidity ^0.8.24;

import { FHE, euint32, inEuint32 } from "@fhevm/solidity/lib/FHE.sol";
import { SepoliaZamaFHEVMConfig } from "@fhevm/solidity/config/ZamaFHEVMConfig.sol";

/**
 * @title ExampleContract
 * @notice Template contract for FHEVM development
 * @dev Replace this with your own FHE contract
 */
contract ExampleContract is SepoliaZamaFHEVMConfig {
    euint32 private _value;

    event ValueSet(address indexed user);

    constructor() {
        _value = FHE.asEuint32(0);
        FHE.allowThis(_value);
    }

    function setValue(inEuint32 calldata inputValue, bytes calldata inputProof) external {
        euint32 value = FHE.asEuint32(inputValue, inputProof);
        _value = value;

        FHE.allowThis(_value);
        FHE.allow(_value, msg.sender);

        emit ValueSet(msg.sender);
    }

    function getValue() external view returns (euint32) {
        return _value;
    }
}
