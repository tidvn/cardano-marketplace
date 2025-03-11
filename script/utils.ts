import { decodeFirst, Tagged } from "cbor";


export function convertToJSON(decoded) {
  if (Buffer.isBuffer(decoded)) {
    return { bytes: decoded.toString("hex") };
  } else if (typeof decoded === "number") {
    return { int: decoded };
  } else if (typeof decoded === "bigint") {
    return { int: decoded.toString() };
  } else if (decoded instanceof Tagged) {
    const fields = decoded.value.map(function (item) {
      if (Buffer.isBuffer(item)) {
        return { bytes: item.toString("hex") };
      } else if (typeof item === "number") {
        return { int: item };
      } else {
        return null;
      }
    });

    return {
      fields: fields.filter(function (item) {
        return item !== null;
      }),
      constructor: decoded.tag,
    };
  }
}
export const convertInlineDatum = async function ({
  inlineDatum,
}: {
  inlineDatum: string;
}) {
  try {
    const cborDatum: Buffer = Buffer.from(inlineDatum, "hex");
    const decoded = await decodeFirst(cborDatum);
    const jsonStructure = {
      fields: decoded.value.map((item) => convertToJSON(item)),
      constructor: decoded.tag,
    };
    return jsonStructure;
  } catch {
    return null;
  }
};
