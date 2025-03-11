import {
  applyParamsToScript,
  BlockfrostProvider,
  IFetcher,
  MeshTxBuilder,
  MeshWallet,
  PlutusScript,
  serializePlutusScript,
  UTxO,
} from "@meshsdk/core";
import blueprint from "../plutus.json";
import { convertInlineDatum } from "./utils";
import { Plutus } from "./type";

export class MeshAdapter {
  protected fetcher: IFetcher;
  protected wallet: MeshWallet;
  protected meshTxBuilder: MeshTxBuilder;

  protected marketplaceAddress: string;
  protected marketplaceScript: PlutusScript;
  protected marketplaceScriptCbor: string;
  protected marketplaceCompileCode: string;

  constructor({
    wallet = null!,
    fetcher = null!,
    blockfrostProvider = null!,
  }: {
    wallet?: MeshWallet;
    fetcher?: IFetcher;
    blockfrostProvider?: BlockfrostProvider;
  }) {
    this.wallet = wallet;
    this.fetcher = fetcher;
    this.meshTxBuilder = new MeshTxBuilder({
      fetcher: this.fetcher,
      evaluator: blockfrostProvider,
    });

    this.marketplaceCompileCode = this.readValidator(
      blueprint as Plutus,
      "marketplace.marketplace.spend"
    );

    this.marketplaceScriptCbor = applyParamsToScript(
      this.marketplaceCompileCode,
      []
    );

    this.marketplaceScript = {
      code: this.marketplaceScriptCbor,
      version: "V3",
    };

    this.marketplaceAddress = serializePlutusScript(
      this.marketplaceScript,
      undefined,
      0,
      false
    ).address;
  }

  protected getWalletForTx = async (): Promise<{
    utxos: UTxO[];
    collateral: UTxO;
    walletAddress: string;
  }> => {
    const utxos = await this.wallet.getUtxos();
    const collaterals = await this.wallet.getCollateral();
    const walletAddress = await this.wallet.getChangeAddress();
    if (!utxos || utxos.length === 0)
      throw new Error("No UTXOs found in getWalletForTx method.");

    if (!collaterals || collaterals.length === 0)
      throw new Error("No collateral found in getWalletForTx method.");

    if (!walletAddress)
      throw new Error("No wallet address found in getWalletForTx method.");

    return { utxos, collateral: collaterals[0], walletAddress };
  };

  protected getUtxoForTx = async (address: string, txHash: string) => {
    const utxos: UTxO[] = await this.fetcher.fetchAddressUTxOs(address);
    const utxo = utxos.find(function (utxo: UTxO) {
      return utxo.input.txHash === txHash;
    });

    if (!utxo) throw new Error("No UTXOs found in getUtxoForTx method.");
    return utxo;
  };

  protected readValidator = function (plutus: Plutus, title: string): string {
    const validator = plutus.validators.find(function (validator) {
      return validator.title === title;
    });

    if (!validator) {
      throw new Error(`${title} validator not found.`);
    }

    return validator.compiledCode;
  };

  protected readPlutusData = async ({ plutusData }: { plutusData: string }) => {
    const datum = await convertInlineDatum({ inlineDatum: plutusData });
    return {
      seller: datum?.fields[0].bytes,
      price: datum?.fields[1].int,
      policyId: datum?.fields[2].bytes,
      assetName: datum?.fields[3].bytes,
    };
  };

  protected getAddressUTXOAsset = async (address: string, unit: string) => {
    console.log("Fetching UTXOs for address: ", address, unit);
    const utxos = await this.fetcher.fetchAddressUTxOs(address, unit);
    return utxos[utxos.length - 1];
  };

  protected getAddressUTXOAssets = async (address: string, unit: string) => {
    return await this.fetcher.fetchAddressUTxOs(address, unit);
  };
}
