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

  // test("test", async function () {
  //  const data =
  //    "84a5008282582046ecfbbddbbba0d0361f3d677ba2e1ed590f138a14580774c29a10a20a99b24a0682582046ecfbbddbbba0d0361f3d677ba2e1ed590f138a14580774c29a10a20a99b24a02018383583931c727443d77df6cff95dca383994f4c3024d03ff56b02ecc22b0f3f652c967f4bd28944b06462e13c5e3f5d5fa6e03f8567569438cd833e6d821a0013a9f2a1581cd9312da562da182b02322fd8acb536f37eb9d29fba7c49dc17255527a145746964766e015820908589384aba18ef8a8d4ae666175830d0f5e5fed176a2cb15f5febe0dc2239c825839015a448adaedf44589a0b71fadea7997cb4499a9d31f24a8ec030500f1095790bd092e5497b4831e314b20c76472ffef6d92588e591ad1ab83821a001b6c96a4581ca1e52cef575a2969269e9d7370eab3be0dd4d397dd9267fb3e8f66dba14c000de14048414e4f4930393901581cd436d9f6b754582f798fe33f4bed12133d47493f78b944b9cc55fd18a14948616e6f693030343601581cde5837d0ec2eecdbaf335436a72d0c838cf0346a371a311e6875e7e2a14d3635376436636134303538643101581cfd674ecba5d7914396fce1d75f920633943123dce8a525f88e1ba6daa24b43533233434c4530303831014b43533233434c453031383101825839015a448adaedf44589a0b71fadea7997cb4499a9d31f24a8ec030500f1095790bd092e5497b4831e314b20c76472ffef6d92588e591ad1ab831a08ea80b6021a00030479031a08f17bd7075820be7340a74b6055476a82f1f354c9855bb130b4175b40287b878fea611f9a6ceea0f5a5181e61361832784064383739396639666438373939666438373939666438373939663538316335613434386164616564663434353839613062373166616465613739393763623434183378403939613964333166323461386563303330353030663166666438373939666438373939666438373939663538316330393537393062643039326535343937623418347840383331653331346232306337363437326666656636643932353838653539316164316162383366666666666666663161303564373563383066666666353831631835783b356134343861646165646634343538396130623731666164656137393937636234343939613964333166323461386563303330353030663166662c";
  //     const decoded = await decodeFirst(data);
  //     console.log(decoded);
  // });

  test("Sell", async function () {
    return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: sellerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });

    const unsignedTx: string = await marketplaceContract.sell({
      policyId: "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062",
      assetName: "000de140687562303031",
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
      policyId: "993c0fba196581430cbf02c263acf6f33409ff9fe4ac56d21b5653c7",
      assetName: "000de140687562303033",
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
    // return;
    const marketplaceContract: MarketplaceContract = new MarketplaceContract({
      wallet: sellerWallet,
      fetcher: blockfrostProvider,
      blockfrostProvider: blockfrostProvider,
    });
    const unsignedTx: string = await marketplaceContract.withdraw({
      policyId: "5a7fafefd25882bdc91441f52a688e85bdb66482968defcc5a109062",
      assetName: "000de140687562303031",
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
