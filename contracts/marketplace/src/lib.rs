#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub invoice_token: Address,
    pub escrow: Address,
    pub price: i128,
    pub min_amt: i128,
    pub available: i128,
    pub sold: i128,
    pub active: bool,
}

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    // Initialize the contract
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        if env.storage().instance().has(&0) {
            panic!("already initialized");
        }
        env.storage().instance().set(&0, &admin);
    }

    // List a token for sale
    pub fn list(
        env: Env,
        admin: Address,
        id: u64,
        token: Address,
        escrow: Address,
        price: i128,
        min: i128,
        amt: i128,
    ) {
        admin.require_auth();
        
        // Verify admin
        let stored_admin: Address = env.storage().instance().get(&0).unwrap();
        if admin != stored_admin {
            panic!("not admin");
        }

        let listing = Listing {
            invoice_token: token,
            escrow,
            price,
            min_amt: min,
            available: amt,
            sold: 0,
            active: true,
        };

        env.storage().persistent().set(&id, &listing);
    }

    // Purchase tokens
    pub fn buy(env: Env, buyer: Address, id: u64, amt: i128) {
        buyer.require_auth();

        let mut listing: Listing = env.storage().persistent().get(&id).unwrap();

        if !listing.active {
            panic!("not active");
        }

        if amt < listing.min_amt {
            panic!("below min amount");
        }

        let remaining = listing.available - listing.sold;
        if amt > remaining {
            panic!("insufficient funds");
        }

        listing.sold += amt;
        
        if listing.sold >= listing.available {
            listing.active = false;
        }

        env.storage().persistent().set(&id, &listing);
    }

    // Get listing details
    pub fn get(env: Env, id: u64) -> Listing {
        env.storage().persistent().get(&id).unwrap()
    }

    // Remove a listing
    pub fn remove(env: Env, admin: Address, id: u64) {
        admin.require_auth();
        
        let stored_admin: Address = env.storage().instance().get(&0).unwrap();
        if admin != stored_admin {
            panic!("not admin");
        }

        let mut listing: Listing = env.storage().persistent().get(&id).unwrap();
        listing.active = false;
        env.storage().persistent().set(&id, &listing);
    }
}
