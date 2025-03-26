import { PinataSDK } from "pinata";

export const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT || "",
  pinataGateway:
    process.env.PINATA_GATEWAY || "amaranth-tricky-lemur-934.mypinata.cloud", // Optional: your gateway domain
});
