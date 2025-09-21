// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.8.2 <0.9.0;

contract VM {

    function special() public pure returns (uint256) {
        return 69;
    }

    function isEven(uint256 a) public pure returns (bool) {
        return a % 2 == 0;
    }
    
    function equal(uint256 a, uint256 b) public pure returns (bool) {
        return a == b;
    }
    
    function greaterThan(uint256 a, uint256 b) public pure returns (bool) {
        return a > b;
    }
    
    function lessThan(uint256 a, uint256 b) public pure returns (bool) {
        return a < b;
    }

    function mul(uint256 a, uint256 b) public pure returns (uint256) {
        return a * b;
    }

    function add(uint256 a, uint256 b) public pure returns (uint256) {
        return a + b;
    }

    function execute(bytes memory input) public pure returns (uint256) {
        require(input.length >= 2, "Input too short for both counts");

        uint256 offset = 0;
        
        // Load uint256 values
        uint8 uint256Count = uint8(input[offset++]);
        require(input.length >= offset + uint256Count * 32, "Not enough bytes for uint256s");

        uint256[256] memory buff_uint256;
        for (uint256 j = 0; j < uint256Count; j++) {
            buff_uint256[j] = bytesToUint256(input, offset);
            offset += 32;
        }

        // Load bool values
        uint8 boolCount = uint8(input[offset++]);
        require(input.length >= offset + boolCount, "Not enough bytes for bools");
        
        bool[256] memory buff_bool;
        for (uint256 j = 0; j < boolCount; j++) {
            buff_bool[j] = uint8(input[offset++]) != 0;
        }

        // Instructions start here
        uint256 instrOffset = offset;

        while (instrOffset < input.length) {
            uint8 opcode = uint8(input[instrOffset]);
            instrOffset++;

            if (opcode == 0) { // add: 2 uint256 args + 1 uint256 ret
                require(instrOffset + 3 <= input.length, "Not enough bytes for add instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 arg2 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_uint256[ret] = add(buff_uint256[arg1], buff_uint256[arg2]);
                
            } else if (opcode == 1) { // mul: 2 uint256 args + 1 uint256 ret
                require(instrOffset + 3 <= input.length, "Not enough bytes for mul instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 arg2 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_uint256[ret] = mul(buff_uint256[arg1], buff_uint256[arg2]);
                
            } else if (opcode == 2) { // isEven: 1 uint256 arg + 1 bool ret
                require(instrOffset + 2 <= input.length, "Not enough bytes for isEven instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_bool[ret] = isEven(buff_uint256[arg1]);
                
            } else if (opcode == 3) { // special: 0 args + 1 uint256 ret
                require(instrOffset + 1 <= input.length, "Not enough bytes for special instruction");
                uint8 ret = uint8(input[instrOffset++]);
                buff_uint256[ret] = special();
                
            } else if (opcode == 4) { // return uint256 at index
                require(instrOffset + 1 <= input.length, "Not enough bytes for return instruction");
                uint8 ret_idx = uint8(input[instrOffset++]);
                return buff_uint256[ret_idx];
                
            } else if (opcode == 5) { // equal: 2 uint256 args + 1 bool ret
                require(instrOffset + 3 <= input.length, "Not enough bytes for equal instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 arg2 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_bool[ret] = equal(buff_uint256[arg1], buff_uint256[arg2]);
                
            } else if (opcode == 6) { // greaterThan: 2 uint256 args + 1 bool ret
                require(instrOffset + 3 <= input.length, "Not enough bytes for greaterThan instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 arg2 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_bool[ret] = greaterThan(buff_uint256[arg1], buff_uint256[arg2]);
                
            } else if (opcode == 7) { // lessThan: 2 uint256 args + 1 bool ret
                require(instrOffset + 3 <= input.length, "Not enough bytes for lessThan instruction");
                uint8 arg1 = uint8(input[instrOffset++]);
                uint8 arg2 = uint8(input[instrOffset++]);
                uint8 ret = uint8(input[instrOffset++]);
                buff_bool[ret] = lessThan(buff_uint256[arg1], buff_uint256[arg2]);
                
            } else if (opcode == 8) { // return bool at index (as uint256: true=1, false=0)
                require(instrOffset + 1 <= input.length, "Not enough bytes for return bool instruction");
                uint8 ret_idx = uint8(input[instrOffset++]);
                return buff_bool[ret_idx] ? 1 : 0;
                
            } else {
                revert("Invalid opcode");
            }
        }

        // If no return opcode executed, default return 0
        return 0;
    }



    function bytesToUint256(bytes memory data, uint offset) internal pure returns (uint256 result) {
        require(offset + 32 <= data.length, "Out of bounds");
        for (uint i = 0; i < 32; i++) {
            result = (result << 8) | uint8(data[offset + i]);
        }
    }
} 