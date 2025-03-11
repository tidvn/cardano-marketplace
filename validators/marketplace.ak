use aiken/collection/list
use cardano/address.{Address}
use cardano/assets.{AssetName, PolicyId, from_lovelace, lovelace_of}
use cardano/transaction.{OutputReference, Transaction, find_input}
use cocktail/vodka_address.{address_pub_key}
use cocktail/vodka_inputs.{inputs_at}
use cocktail/vodka_value.{get_all_value_to, value_geq}

pub type MarketplaceDatum {
  seller: Address,
  price: Int,
  policy_id: PolicyId,
  asset_name: AssetName,
}

pub type MarketplaceRedeemer {
  Buy
  WithdrawOrUpdate
}

validator marketplace {
  spend(
    datum: Option<MarketplaceDatum>,
    redeemer: MarketplaceRedeemer,
    utxo: OutputReference,
    tx: Transaction,
  ) {
    expect Some(datum) = datum
    when redeemer is {
      Buy -> {
        expect Some(own_input) = find_input(tx.inputs, utxo)
        let own_address = own_input.output.address
        let is_only_one_input_from_script =
          when inputs_at(tx.inputs, own_address) is {
            [_] -> True
            _ -> False
          }
        let is_proceed_paid =
          get_all_value_to(tx.outputs, datum.seller)
            |> value_geq(
                from_lovelace(datum.price + lovelace_of(own_input.output.value)),
              )
        is_only_one_input_from_script && is_proceed_paid
      }
      WithdrawOrUpdate -> {
        expect Some(pub_key) = address_pub_key(datum.seller)
        list.has(tx.extra_signatories, pub_key)
      }
    }
  }

  else(_) {
    fail @"This script only supports spend"
  }
}
