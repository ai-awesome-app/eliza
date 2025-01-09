export const balanceTemplate = `Given the recent messages and wallet information below:

{{recentMessages}}

{{walletInfo}}

Extract the following information about the requested transfer:
- Chain to execute on: Must be one of ["ethereum", "base", ...] (like in viem/chains)
- Owner address: Must be a valid Ethereum address starting with "0x"
- Token symbol or address (if not native token): Optional, leave as null for ETH transfers

Respond with a JSON markdown block containing only the extracted values. All fields except 'token' are required:

\`\`\`json
{
    "chain": SUPPORTED_CHAINS,
    "address": string,
    "token": string | null
}
\`\`\`
`;
