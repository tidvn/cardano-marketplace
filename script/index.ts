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
  parseAssetUnit,
  mConStr1,
} from "@meshsdk/core";
import { MeshAdapter } from "./mesh";

export class MarketplaceContract extends MeshAdapter {
  /**
   * @method SELL
   *
   */
  sell = async ({
    unit,
    price,
  }: {
    unit: string;
    price: number;
  }): Promise<string> => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const { pubKeyHash, stakeCredentialHash } =
      deserializeAddress(walletAddress);
    const { policyId, assetName } = parseAssetUnit(unit);
    const nftUtxo = await this.getAddressUTXOAsset(walletAddress, unit);
    if (!nftUtxo) throw new Error("NFT UTXO not found");
    const unsignedTx = this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txOut(this.marketplaceAddress, [
        {
          quantity: "1",
          unit: unit,
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
  buy = async ({ unit }: { unit: string }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const marketplaceUtxo = await this.getAddressUTXOAsset(
      this.marketplaceAddress,
      unit
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
          unit: unit,
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
  withdraw = async ({ unit }: { unit: string }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const utxo = await this.getAddressUTXOAsset(this.marketplaceAddress, unit);
    console.log(utxo);

    const unsignedTx = await this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txIn(utxo.input.txHash, utxo.input.outputIndex)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr1([]))
      .txInScript(this.marketplaceScriptCbor)

      .txOut(walletAddress, [
        {
          unit: unit,
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
  update = async ({ unit, newPrice }: { unit: string; newPrice: number }) => {
    const { utxos, walletAddress, collateral } = await this.getWalletForTx();
    const utxo = await this.getAddressUTXOAsset(this.marketplaceAddress, unit);

    const { pubKeyHash, stakeCredentialHash } =
      deserializeAddress(walletAddress);
    const { policyId, assetName } = parseAssetUnit(unit);

    const unsignedTx = await this.meshTxBuilder
      .spendingPlutusScriptV3()
      .txIn(utxo.input.txHash, utxo.input.outputIndex)
      .txInInlineDatumPresent()
      .txInRedeemerValue(mConStr1([]))
      .txInScript(this.marketplaceScriptCbor)

      .txOut(walletAddress, [
        {
          unit: unit,
          quantity: "1",
        },
      ])
      .txOutInlineDatumValue(
        conStr0([
          pubKeyAddress(pubKeyHash, stakeCredentialHash),
          integer(newPrice),
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
      .setNetwork("preview")
      .complete();
    return unsignedTx;
  };
}
