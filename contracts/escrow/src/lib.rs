#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum EscrowStatus {
    Pending,
    Funded,
    Released,
    Default,
}

const ADMIN: Symbol = symbol_short!("ADMIN");
const INV_TOKEN: Symbol = symbol_short!("INV_TOKEN");
const SMB_ADDR: Symbol = symbol_short!("SMB_ADDR");
const TOT_AMT: Symbol = symbol_short!("TOT_AMT");
const DISC_RATE: Symbol = symbol_short!("DISC_RATE");
const TOT_DEP: Symbol = symbol_short!("TOT_DEP");
const STATUS: Symbol = symbol_short!("STATUS");
const DEPOSIT: Symbol = symbol_short!("DEPOSIT");

#[contract]
pub struct Escrow;

#[contractimpl]
impl Escrow {
    pub fn initialize(
        env: Env,
        admin: Address,
        invoice_token: Address,
        smb_address: Address,
        total_amount: i128,
        discount_rate: i128,
    ) {
        admin.require_auth();

        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }

        if total_amount <= 0 {
            panic!("total_amount must be positive");
        }

        if discount_rate < 0 || discount_rate > 10000 {
            panic!("discount_rate must be between 0 and 10000 (basis points)");
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&INV_TOKEN, &invoice_token);
        env.storage().instance().set(&SMB_ADDR, &smb_address);
        env.storage().instance().set(&TOT_AMT, &total_amount);
        env.storage().instance().set(&DISC_RATE, &discount_rate);
        env.storage().instance().set(&TOT_DEP, &0);
        env.storage()
            .instance()
            .set(&STATUS, &EscrowStatus::Pending);
    }

    pub fn deposit(env: Env, investor: Address, amount: i128) {
        investor.require_auth();

        let status: EscrowStatus = env
            .storage()
            .instance()
            .get(&STATUS)
            .unwrap_or(EscrowStatus::Pending);

        if status != EscrowStatus::Pending && status != EscrowStatus::Funded {
            panic!("escrow not accepting deposits");
        }

        if amount <= 0 {
            panic!("amount must be positive");
        }

        let total_deposited: i128 = env
            .storage()
            .instance()
            .get(&TOT_DEP)
            .unwrap_or(0);

        let new_total = total_deposited + amount;
        env.storage().instance().set(&TOT_DEP, &new_total);

        let investor_deposit: i128 = env
            .storage()
            .instance()
            .get(&(&DEPOSIT, &investor))
            .unwrap_or(0);

        env.storage()
            .instance()
            .set(&(&DEPOSIT, &investor), &(investor_deposit + amount));

        let total_amount: i128 = env.storage().instance().get(&TOT_AMT).unwrap();
        if new_total >= total_amount {
            env.storage()
                .instance()
                .set(&STATUS, &EscrowStatus::Funded);
        }
    }

    pub fn get_status(env: Env) -> EscrowStatus {
        env.storage()
            .instance()
            .get(&STATUS)
            .unwrap_or(EscrowStatus::Pending)
    }

    pub fn get_total_deposited(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&TOT_DEP)
            .unwrap_or(0)
    }

    pub fn is_fully_funded(env: Env) -> bool {
        let total_deposited: i128 = Self::get_total_deposited(env.clone());
        let total_amount: i128 = env
            .storage()
            .instance()
            .get(&TOT_AMT)
            .unwrap_or(0);
        total_deposited >= total_amount
    }

    pub fn release_payment(env: Env, verifier: Address) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .unwrap();
        
        if verifier != admin {
            verifier.require_auth();
        }

        let status: EscrowStatus = Self::get_status(env.clone());
        if status != EscrowStatus::Funded {
            panic!("escrow not funded");
        }

        env.storage()
            .instance()
            .set(&STATUS, &EscrowStatus::Released);
    }

    pub fn handle_default(env: Env, admin: Address) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .unwrap();
        
        if admin != stored_admin {
            panic!("unauthorized");
        }

        env.storage()
            .instance()
            .set(&STATUS, &EscrowStatus::Default);
    }
}

#[cfg(test)]
mod test;

