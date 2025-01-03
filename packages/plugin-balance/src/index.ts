export * from "./actions/balance.ts";
export * from "./providers/wallet";
export * from "./types";

import type { Plugin } from "@elizaos/core";
import { balanceAction } from "./actions/balance.ts";
import { evmWalletProvider } from "./providers/wallet";

export const balancePlugin: Plugin = {
    name: "balance",
    description: "EVM balance blockchain integration plugin",
    providers: [evmWalletProvider],
    evaluators: [],
    services: [],
    actions: [balanceAction],
};

export default balancePlugin;
