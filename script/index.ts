import {
  conStr0,
  deserializeAddress,
  integer,
  mConStr0,
  policyId as toPolicyId,
  assetName as toAssetName,
  pubKeyAddress,
  deserializeDatum,
  serializeAddressObj,
} from "@meshsdk/core";
import { MeshAdapter } from "./mesh";

export class MarketplaceContract extends MeshAdapter {
  /**
   * @method SELL
   *
   */
  sell = async ({
    policyId,
    assetName,
    price,
  }: {
    policyId: string;
    assetName: string;
    price: number;
  }): Promise<string> => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const { pubKeyHash, stakeCredentialHash } =
      deserializeAddress(walletAddress);

    const unsignedTx = this.meshTxBuilder
      .txOut(this.marketplaceAddress, [
        {
          quantity: "1",
          unit: policyId + assetName,
        },
      ])
      .txOutInlineDatumValue(
        conStr0([
          pubKeyAddress(pubKeyHash, stakeCredentialHash),
          integer(price),
          toPolicyId(policyId),
          toAssetName(assetName),
        ]),
        "JSON"
      )
      .changeAddress(walletAddress)
      .requiredSignerHash(deserializeAddress(walletAddress).pubKeyHash)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .setNetwork("preview");

    return await unsignedTx.complete();
  };

  /**
   * @method BUY
   *
   */
  buy = async ({
    policyId,
    assetName,
  }: {
    policyId: string;
    assetName: string;
  }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const marketplaceUtxo = await this.getAddressUTXOAsset(
      this.marketplaceAddress,
      policyId + assetName
    );
    if (!marketplaceUtxo) throw new Error("UTxO not found");
    const plutusData = marketplaceUtxo?.output?.plutusData as string;
    const datum = await this.readPlutusData({
      plutusData: plutusData,
    });
    datum.seller = serializeAddressObj(
      deserializeDatum(plutusData).fields[0],
      0
    );
    const inputLovelace = Number(
      marketplaceUtxo.output.amount.find((a) => a.unit === "lovelace")!.quantity
    );
    const unsignedTx = await this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txIn(marketplaceUtxo.input.txHash, marketplaceUtxo.input.outputIndex)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([]))
      .txInScript(this.marketplaceScriptCbor)

      .txOut(datum.seller, [
        {
          unit: "lovelace",
          quantity: String(datum?.price + inputLovelace),
        },
      ])
      .txOut(walletAddress, [
        {
          unit: policyId + assetName,
          quantity: "1",
        },
      ])

      .changeAddress(walletAddress)
      .requiredSignerHash(deserializeAddress(walletAddress).pubKeyHash)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .setNetwork("preview")
      .complete();
    return unsignedTx;
  };

  /**
   * @method WITHDRAW
   *
   */
  withdraw = async ({
    policyId,
    assetName,
  }: {
    policyId: string;
    assetName: string;
  }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const utxo = await this.getAddressUTXOAsset(
      this.marketplaceAddress,
      policyId + assetName
    );
    console.log(utxo);

    const unsignedTx = await this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txIn(utxo.input.txHash, utxo.input.outputIndex)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([]))
      .txInScript(this.marketplaceScriptCbor)

      .txOut(walletAddress, [
        {
          unit: policyId + assetName,
          quantity: "1",
        },
      ])
      .changeAddress(walletAddress)
      .requiredSignerHash(deserializeAddress(walletAddress).pubKeyHash)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .setNetwork("preview")
      .complete();
    return unsignedTx;
  };
  /**
   * @method UPDATE
   *
   */
  update = async ({
    policyId,
    assetName,
    amount = 1,
    price,
  }: {
    policyId: string;
    assetName: string;
    amount: number;
    price: number;
  }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const utxo = await this.getAddressUTXOAsset(
      this.marketplaceAddress,
      policyId + assetName
    );
    const sellerPaymentKeyHash = deserializeAddress(walletAddress).pubKeyHash;
    const unsignedTx = await this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txIn(utxo.input.txHash, utxo.input.outputIndex)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr0([]))
      .txInScript(this.marketplaceScriptCbor)

      .txOut(walletAddress, [
        {
          unit: policyId + assetName,
          quantity: String(amount),
        },
      ])
      .txOutInlineDatumValue(
        mConStr0([policyId, assetName, sellerPaymentKeyHash, price])
      )

      .changeAddress(walletAddress)
      .requiredSignerHash(deserializeAddress(walletAddress).pubKeyHash)
      .selectUtxosFrom(utxos)
      .txInCollateral(
        collateral.input.txHash,
        collateral.input.outputIndex,
        collateral.output.amount,
        collateral.output.address
      )
      .setNetwork("preview")
      .complete();
    return unsignedTx;
  };
}
