use stylus_sdk::{
    alloy_primitives::{Address, U256},
    call::Call,
    prelude::*,
    storage::StorageAddress,
};

// External contract interfaces
pub trait IARBPriceConsumer {
    fn get_latest_price(&self) -> Result<U256, Vec<u8>>;
    fn get_price_feed_address(&self) -> Result<Address, Vec<u8>>;
}

pub trait IRedotPayVault {
    fn initialize(&mut self) -> Result<(), Vec<u8>>;
    fn accept_payment(&mut self, token: Address, amount: U256, recipient: Address, condition: U256, release_time: U256) -> Result<U256, Vec<u8>>;
    fn freeze_payment(&mut self, payment_id: U256, freeze_period: U256) -> Result<(), Vec<u8>>;
    fn release_payment(&mut self, payment_id: U256) -> Result<(), Vec<u8>>;
    fn refund_payment(&mut self, payment_id: U256) -> Result<(), Vec<u8>>;
    fn get_payment(&self, payment_id: U256) -> Result<(Address, Address, Address, U256, U256, U256, U256, U256), Vec<u8>>;
    fn get_user_balance(&self, user: Address, token: Address) -> Result<U256, Vec<u8>>;
    fn get_frozen_balance(&self, user: Address, token: Address) -> Result<U256, Vec<u8>>;
    fn get_payment_counter(&self) -> Result<U256, Vec<u8>>;
    fn owner(&self) -> Result<Address, Vec<u8>>;
    fn is_authorized_approver(&self, addr: Address) -> Result<bool, Vec<u8>>;
    fn is_paused(&self) -> Result<bool, Vec<u8>>;
    fn add_approver(&mut self, approver: Address) -> Result<(), Vec<u8>>;
    fn remove_approver(&mut self, approver: Address) -> Result<(), Vec<u8>>;
    fn pause(&mut self) -> Result<(), Vec<u8>>;
    fn unpause(&mut self) -> Result<(), Vec<u8>>;
    fn require_owner(&self) -> Result<(), Vec<u8>>;
    fn require_owner_or_approver(&self) -> Result<(), Vec<u8>>;
    fn require_not_paused(&self) -> Result<(), Vec<u8>>;
}

#[storage]
#[entrypoint]
pub struct VM {
    arb_price_consumer: StorageAddress,
    redot_pay_vault: StorageAddress,
}

#[public]
impl VM {
    pub fn new(arb_price_consumer_address: Address, redot_pay_vault_address: Address) -> Result<Self, Vec<u8>> {
        Ok(VM {
            arb_price_consumer: arb_price_consumer_address.into(),
            redot_pay_vault: redot_pay_vault_address.into(),
        })
    }

    // Arithmetic functions
    pub fn add(&self, a: U256, b: U256) -> U256 {
        a + b
    }

    pub fn mul(&self, a: U256, b: U256) -> U256 {
        a * b
    }

    pub fn sub(&self, a: U256, b: U256) -> Result<U256, Vec<u8>> {
        if a >= b {
            Ok(a - b)
        } else {
            Err(b"Subtraction underflow".to_vec())
        }
    }

    pub fn div(&self, a: U256, b: U256) -> Result<U256, Vec<u8>> {
        if b.is_zero() {
            Err(b"Division by zero".to_vec())
        } else {
            Ok(a / b)
        }
    }

    pub fn special(&self) -> U256 {
        U256::from(69)
    }

    // Comparison functions
    pub fn is_even(&self, a: U256) -> bool {
        a % U256::from(2) == U256::ZERO
    }

    pub fn equal(&self, a: U256, b: U256) -> bool {
        a == b
    }

    pub fn greater_than(&self, a: U256, b: U256) -> bool {
        a > b
    }

    pub fn less_than(&self, a: U256, b: U256) -> bool {
        a < b
    }

    // Helper function to convert bytes to U256
    fn bytes_to_u256(&self, data: &[u8], offset: usize) -> Result<U256, Vec<u8>> {
        if offset + 32 > data.len() {
            return Err(b"Out of bounds".to_vec());
        }
        let mut bytes = [0u8; 32];
        bytes.copy_from_slice(&data[offset..offset + 32]);
        Ok(U256::from_be_bytes(bytes))
    }

    // Helper function to convert bytes to Address
    fn bytes_to_address(&self, data: &[u8], offset: usize) -> Result<Address, Vec<u8>> {
        if offset + 20 > data.len() {
            return Err(b"Out of bounds".to_vec());
        }
        let mut bytes = [0u8; 20];
        bytes.copy_from_slice(&data[offset..offset + 20]);
        Ok(Address::from(bytes))
    }

    // Main execution function
    pub fn execute(&mut self, input: Vec<u8>, item_price: U256) -> Result<U256, Vec<u8>> {
        if input.len() < 3 {
            return Err(b"Input too short for all counts".to_vec());
        }

        let mut offset = 0;
        
        // Initialize buffers
        let mut buff_uint256 = [U256::ZERO; 256];
        let mut buff_bool = [false; 256];
        let mut buff_address = [Address::ZERO; 256];

        // Load uint256 values
        let uint256_count = input[offset] as usize;
        offset += 1;
        
        if input.len() < offset + uint256_count * 32 {
            return Err(b"Not enough bytes for uint256s".to_vec());
        }

        for j in 0..uint256_count {
            buff_uint256[j] = self.bytes_to_u256(&input, offset)?;
            offset += 32;
        }

        // Load bool values
        let bool_count = input[offset] as usize;
        offset += 1;

        if input.len() < offset + bool_count {
            return Err(b"Not enough bytes for bools".to_vec());
        }

        for j in 0..bool_count {
            buff_bool[j] = input[offset] != 0;
            offset += 1;
        }

        // Load address values
        let address_count = input[offset] as usize;
        offset += 1;

        if input.len() < offset + address_count * 20 {
            return Err(b"Not enough bytes for addresses".to_vec());
        }

        for j in 0..address_count {
            buff_address[j] = self.bytes_to_address(&input, offset)?;
            offset += 20;
        }

        // Execute instructions
        let mut instr_offset = offset;

        while instr_offset < input.len() {
            let opcode = input[instr_offset];
            instr_offset += 1;

            match opcode {
                // Opcode 0: add
                0 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for add instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_uint256[ret] = self.add(buff_uint256[arg1], buff_uint256[arg2]);
                }

                // Opcode 1: mul
                1 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for mul instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_uint256[ret] = self.mul(buff_uint256[arg1], buff_uint256[arg2]);
                }

                // Opcode 2: isEven
                2 => {
                    if instr_offset + 2 > input.len() {
                        return Err(b"Not enough bytes for isEven instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let ret = input[instr_offset + 1] as usize;
                    instr_offset += 2;
                    
                    buff_bool[ret] = self.is_even(buff_uint256[arg1]);
                }

                // Opcode 3: special
                3 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for special instruction".to_vec());
                    }
                    let ret = input[instr_offset] as usize;
                    instr_offset += 1;
                    
                    buff_uint256[ret] = self.special();
                }

                // Opcode 4: return uint256
                4 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for return instruction".to_vec());
                    }
                    let ret_idx = input[instr_offset] as usize;
                    return Ok(buff_uint256[ret_idx]);
                }

                // Opcode 5: equal
                5 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for equal instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_bool[ret] = self.equal(buff_uint256[arg1], buff_uint256[arg2]);
                }

                // Opcode 6: greaterThan
                6 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for greaterThan instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_bool[ret] = self.greater_than(buff_uint256[arg1], buff_uint256[arg2]);
                }

                // Opcode 7: lessThan
                7 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for lessThan instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_bool[ret] = self.less_than(buff_uint256[arg1], buff_uint256[arg2]);
                }

                // Opcode 8: return bool
                8 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for return bool instruction".to_vec());
                    }
                    let ret_idx = input[instr_offset] as usize;
                    return Ok(if buff_bool[ret_idx] { U256::from(1) } else { U256::ZERO });
                }

                // Opcode 30: msg.sender
                30 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for msg.sender instruction".to_vec());
                    }
                    let ret = input[instr_offset] as usize;
                    instr_offset += 1;
                    
                    buff_address[ret] = msg::sender();
                }

                // Opcode 31: itemPrice
                31 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for itemPrice instruction".to_vec());
                    }
                    let ret = input[instr_offset] as usize;
                    instr_offset += 1;
                    
                    buff_uint256[ret] = item_price;
                }

                // Opcode 32: sub
                32 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for sub instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_uint256[ret] = self.sub(buff_uint256[arg1], buff_uint256[arg2])?;
                }

                // Opcode 33: div
                33 => {
                    if instr_offset + 3 > input.len() {
                        return Err(b"Not enough bytes for div instruction".to_vec());
                    }
                    let arg1 = input[instr_offset] as usize;
                    let arg2 = input[instr_offset + 1] as usize;
                    let ret = input[instr_offset + 2] as usize;
                    instr_offset += 3;
                    
                    buff_uint256[ret] = self.div(buff_uint256[arg1], buff_uint256[arg2])?;
                }

                // External contract calls would require more complex implementation
                // For brevity, showing structure for ARB price consumer calls:

                // Opcode 9: getLatestPrice
                9 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for getLatestPrice instruction".to_vec());
                    }
                    let ret = input[instr_offset] as usize;
                    instr_offset += 1;
                    
                    // In real implementation, would make external call
                    // buff_uint256[ret] = arb_price_consumer.get_latest_price()?;
                    buff_uint256[ret] = U256::from(1000); // Mock value
                }

                // Opcode 10: getPriceFeedAddress
                10 => {
                    if instr_offset + 1 > input.len() {
                        return Err(b"Not enough bytes for getPriceFeedAddress instruction".to_vec());
                    }
                    let ret = input[instr_offset] as usize;
                    instr_offset += 1;
                    
                    // In real implementation, would make external call
                    // buff_address[ret] = arb_price_consumer.get_price_feed_address()?;
                    buff_address[ret] = Address::ZERO; // Mock value
                }

                // Additional RedotPayVault opcodes would follow similar pattern...
                // Opcodes 11-29 would be implemented here

                _ => {
                    return Err(b"Invalid opcode".to_vec());
                }
            }
        }

        // Default return if no explicit return opcode
        Ok(U256::ZERO)
    }

    // Getter functions for external contracts
    pub fn arb_price_consumer(&self) -> Address {
        self.arb_price_consumer.get()
    }

    pub fn redot_pay_vault(&self) -> Address {
        self.redot_pay_vault.get()
    }
} 
