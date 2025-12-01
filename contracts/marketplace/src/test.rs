#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env};

#[test]
fn test_listing_and_purchase() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, Marketplace);
    let client = MarketplaceClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let invoice_token = Address::generate(&env);
    let escrow = Address::generate(&env);
    let investor = Address::generate(&env);

    client.initialize(&admin);

    let listing_id = 1u64;
    let price = 100;
    let min_invest = 50;
    let total = 1000;

    client.list_token(
        &admin,
        &listing_id,
        &invoice_token,
        &escrow,
        &price,
        &min_invest,
        &total,
    );

    let listing = client.get_listing(&listing_id);
    assert_eq!(listing.total_available, total);
    assert!(listing.is_active);

    client.purchase(&investor, &listing_id, &100);

    let listing_after = client.get_listing(&listing_id);
    assert_eq!(listing_after.total_sold, 100);
}

