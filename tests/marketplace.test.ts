/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, test, expect, beforeEach, jest } from "@jest/globals";
import {
  BlockfrostProvider,
  deserializeAddress,
  deserializeDatum,
  MeshWallet,
  serializeNativeScript,
} from "@meshsdk/core";
import { MarketplaceContract } from "../script";
import { convertInlineDatum } from "../script/utils";
import { decodeFirst } from "cbor";

describe("Marketplace", function () {
  let txHashTemp: string;
  let buyerWallet: MeshWallet;
  let sellerWallet: MeshWallet;
  let blockfrostProvider: BlockfrostProvider;

  beforeEach(async function () {
    blockfrostProvider = new BlockfrostProvider(
      process.env.BLOCKFROST_API_KEY || ""
    );

    sellerWallet = new MeshWallet({
      networkId: 0,
      fetcher: blockfrostProvider,
      submitter: blockfrostProvider,
      key: {
        type: "mnemonic",
        words: process.env.W1?.split(" ") || [],
      },
    });

    buyerWallet = new MeshWallet({
      networkId: 0,
      fetcher: blockfrostProvider,
      submitter: blockfrostProvider,
      key: {
        type: "mnemonic",
        words: process.env.W2?.split(" ") || [],
      },
    });
  });
  jest.setTimeout(60000);

  test("Sell", async function () {
    return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: sellerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });

    const unsignedTx: string = await marketplaceContract.sell({
      unit:
        "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062" +
        "000de140687562303035",
      price: 10_000_000,
    });
    const signedTx = await sellerWallet.signTx(unsignedTx, true);
    const txHash = await sellerWallet.submitTx(signedTx);
    console.log("https://preview.cexplorer.io/tx/" + txHash);
    txHashTemp = txHash;
    blockfrostProvider.onTxConfirmed(txHash, () => {
      expect(txHash.length).toBe(64);
    });
  });

  test("Buy", async function () {
    return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: buyerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });
    const unsignedTx: string = await marketplaceContract.buy({
      unit:
        "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062" +
        "000de140687562303033",
    });
    const signedTx = await buyerWallet.signTx(unsignedTx, true);
    const txHash = await buyerWallet.submitTx(signedTx);
    console.log("https://preview.cexplorer.io/tx/" + txHash);
    txHashTemp = txHash;
    blockfrostProvider.onTxConfirmed(txHash, () => {
      expect(txHash.length).toBe(64);
    });
  });

  test("Withdraw", async function () {
    return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: sellerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });
    const unsignedTx: string = await marketplaceContract.withdraw({
      unit:
        "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062" +
        "000de140687562303035",
    });
    const signedTx = await sellerWallet.signTx(unsignedTx, true);
    const txHash = await sellerWallet.submitTx(signedTx);
    console.log("https://preview.cexplorer.io/tx/" + txHash);
    txHashTemp = txHash;
    blockfrostProvider.onTxConfirmed(txHash, () => {
      expect(txHash.length).toBe(64);
    });
  });
  test("Update", async function () {
    // return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: sellerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });
    const unsignedTx: string = await marketplaceContract.update({
      unit:
        "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062" +
        "000de140687562303035",
      newPrice: 20_000_000,
    });
    const signedTx = await sellerWallet.signTx(unsignedTx, true);
    const txHash = await sellerWallet.submitTx(signedTx);
    console.log("https://preview.cexplorer.io/tx/" + txHash);
    txHashTemp = txHash;
    blockfrostProvider.onTxConfirmed(txHash, () => {
      expect(txHash.length).toBe(64);
    });
  });
});
