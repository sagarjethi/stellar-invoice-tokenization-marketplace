#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol, Vec,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Listing {
    pub invoice_token: Address,
    pub escrow: Address,
    pub price_per_token: i128,
    pub min_investment: i128,
    pub total_available: i128,
    pub total_sold: i128,
    pub is_active: bool,
    pub created_at: u64,
}

const ADMIN: Symbol = symbol_short!("ADMIN");
const LISTING: Symbol = symbol_short!("LISTING");
const ACTIVE: Symbol = symbol_short!("ACTIVE");

#[contract]
pub struct Marketplace;

#[contractimpl]
impl Marketplace {
    pub fn initialize(env: Env, admin: Address) {
        admin.require_auth();
        
        if env.storage().instance().has(&ADMIN) {
            panic!("already initialized");
        }
        
        env.storage().instance().set(&ADMIN, &admin);
        env.storage()
            .instance()
            .set(&ACTIVE, &Vec::<String>::new(&env));
    }

    pub fn list_token(
        env: Env,
        admin: Address,
        listing_id: String,
        invoice_token: Address,
        escrow: Address,
        price_per_token: i128,
        min_investment: i128,
        total_available: i128,
    ) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .unwrap();
        
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let listing = Listing {
            invoice_token,
            escrow,
            price_per_token,
            min_investment,
            total_available,
            total_sold: 0,
            is_active: true,
            created_at: env.ledger().timestamp(),
        };

        env.storage()
            .instance()
            .set(&(&LISTING, listing_id.clone()), &listing);

        let mut active_listings: Vec<String> = env
            .storage()
            .instance()
            .get(&ACTIVE)
            .unwrap_or(Vec::<String>::new(&env));

        active_listings.push_back(listing_id.clone());
        env.storage().instance().set(&ACTIVE, &active_listings);
    }

    pub fn purchase(
        env: Env,
        investor: Address,
        listing_id: String,
        amount: i128,
    ) {
        investor.require_auth();

        let mut listing: Listing = env
            .storage()
            .instance()
            .get(&(&LISTING, listing_id.clone()))
            .unwrap();

        if !listing.is_active {
            panic!("listing not active");
        }

        if amount < listing.min_investment {
            panic!("amount below minimum investment");
        }

        let available = listing.total_available - listing.total_sold;
        if amount > available {
            panic!("insufficient tokens available");
        }

        listing.total_sold += amount;
        env.storage()
            .instance()
            .set(&(&LISTING, listing_id.clone()), &listing);

        if listing.total_sold >= listing.total_available {
            listing.is_active = false;
            env.storage()
                .instance()
                .set(&(&LISTING, listing_id.clone()), &listing);

            let active_listings: Vec<String> = env
                .storage()
                .instance()
                .get(&ACTIVE)
                .unwrap_or(Vec::<String>::new(&env));

            let mut new_listings = Vec::<String>::new(&env);
            for i in 0..active_listings.len() {
                let item: String = active_listings.get(i).unwrap();
                if item != listing_id {
                    new_listings.push_back(item);
                }
            }
            env.storage().instance().set(&ACTIVE, &new_listings);
        }
    }

    pub fn get_listing(env: Env, listing_id: String) -> Listing {
        env.storage()
            .instance()
            .get(&(&LISTING, listing_id.clone()))
            .unwrap()
    }

    pub fn get_active_listings(env: Env) -> Vec<String> {
        env.storage()
            .instance()
            .get(&ACTIVE)
            .unwrap_or(Vec::<String>::new(&env))
    }

    pub fn remove_listing(env: Env, admin: Address, listing_id: String) {
        admin.require_auth();

        let stored_admin: Address = env
            .storage()
            .instance()
            .get(&ADMIN)
            .unwrap();
        
        if admin != stored_admin {
            panic!("unauthorized");
        }

        let mut listing: Listing = env
            .storage()
            .instance()
            .get(&(&LISTING, listing_id.clone()))
            .unwrap();

        listing.is_active = false;
        env.storage()
            .instance()
            .set(&(&LISTING, listing_id.clone()), &listing);

        let active_listings: Vec<String> = env
            .storage()
            .instance()
            .get(&ACTIVE)
            .unwrap_or(Vec::<String>::new(&env));

        let mut new_listings = Vec::<String>::new(&env);
        for i in 0..active_listings.len() {
            let item: String = active_listings.get(i).unwrap();
            if item != listing_id {
                new_listings.push_back(item);
            }
        }
        env.storage().instance().set(&ACTIVE, &new_listings);
    }
}

#[cfg(test)]
mod test;

