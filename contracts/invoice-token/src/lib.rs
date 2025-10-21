#![no_std]
use soroban_sdk::{
    contract, contractimpl, symbol_short, Address, Bytes, Env, String, Symbol,
};


const ADMIN: Symbol = symbol_short!("ADMIN");
const INV_ID: Symbol = symbol_short!("INV_ID");
const META_HASH: Symbol = symbol_short!("META_HASH");
const SUPPLY: Symbol = symbol_short!("SUPPLY");
const BALANCE: Symbol = symbol_short!("BALANCE");

#[contract]
pub struct InvoiceToken;

#[contractimpl]
impl InvoiceToken {
    pub fn initialize(
        env: Env,
        admin: Address,
        invoice_id: String,
        metadata_hash: Bytes,
        total_supply: i128,
    ) {
        admin.require_auth();
        
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        
        if total_supply <= 0 {
            panic!("total_supply must be positive");
        }
        
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&INV_ID, &invoice_id);
        env.storage().instance().set(&META_HASH, &metadata_hash);
        env.storage().instance().set(&SUPPLY, &total_supply);
        
        env.storage().instance().set(&(&BALANCE, &admin), &total_supply);
    }

    pub fn balance(env: Env, owner: Address) -> i128 {
        env.storage()
            .instance()
            .get(&(&BALANCE, &owner))
            .unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&SUPPLY)
            .unwrap_or(0)
    }

    pub fn get_invoice_id(env: Env) -> String {
        env.storage()
            .instance()
            .get(&INV_ID)
            .unwrap_or(String::from_str(&env, ""))
    }

    pub fn get_metadata_hash(env: Env) -> Bytes {
        env.storage()
            .instance()
            .get(&META_HASH)
            .unwrap_or(Bytes::new(&env))
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        
        if amount <= 0 {
            panic!("amount must be positive");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let to_balance = Self::balance(env.clone(), to.clone());
        
        env.storage()
            .instance()
            .set(&(&BALANCE, &from), &(from_balance - amount));
        env.storage()
            .instance()
            .set(&(&BALANCE, &to), &(to_balance + amount));
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .unwrap();
        admin.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let total_supply = Self::total_supply(env.clone());
        let new_total = total_supply + amount;
        
        env.storage().instance().set(&SUPPLY, &new_total);
        
        let to_balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&(&BALANCE, &to), &(to_balance + amount));
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let from_balance = Self::balance(env.clone(), from.clone());
        if from_balance < amount {
            panic!("insufficient balance");
        }

        let total_supply = Self::total_supply(env.clone());
        let new_total = total_supply - amount;
        
        env.storage().instance().set(&SUPPLY, &new_total);
        
        env.storage()
            .instance()
            .set(&(&BALANCE, &from), &(from_balance - amount));
    }
}

#[cfg(test)]
mod test;

