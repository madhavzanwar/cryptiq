import { keccak256, toBytes } from "viem";

/** keccak256 of a UTF-8 string as 0x-hex. viem is already in the wallet chunk, so this adds nothing to the page. */
export const keccakUtf8 = (s: string): string => keccak256(toBytes(s));
