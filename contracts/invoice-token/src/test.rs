#![cfg(test)]

use super::*;
use soroban_sdk::{symbol_short, testutils::Address as _, Address, Bytes, Env, String};

#[test]
fn test_initialize() {
    let env = Env::default();
    let contract_id = env.register_contract(None, InvoiceToken);
    let client = InvoiceTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let invoice_id = String::from_str(&env, "INV-001");
    let metadata_hash = Bytes::from_array(&env, &[1, 2, 3, 4]);
    let total_supply = 1000;

    client.initialize(&admin, &invoice_id, &metadata_hash, &total_supply);

    assert_eq!(client.get_invoice_id(), invoice_id);
    assert_eq!(client.total_supply(), total_supply);
    assert_eq!(client.balance(&admin), total_supply);
}

#[test]
fn test_transfer() {
    let env = Env::default();
    let contract_id = env.register_contract(None, InvoiceToken);
    let client = InvoiceTokenClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let invoice_id = String::from_str(&env, "INV-001");
    let metadata_hash = Bytes::from_array(&env, &[1, 2, 3, 4]);
    let total_supply = 1000;

    client.initialize(&admin, &invoice_id, &metadata_hash, &total_supply);

    client.transfer(&admin, &user, &500);

    assert_eq!(client.balance(&admin), 500);
    assert_eq!(client.balance(&user), 500);
}

