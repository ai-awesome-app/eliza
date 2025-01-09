import {
    composeContext,
    generateObjectDeprecated,
    HandlerCallback,
    ModelClass,
    type IAgentRuntime,
    type Memory,
    type State,
} from "@elizaos/core";

import { initWalletProvider, WalletProvider } from "../providers/wallet";
import { GetBalanceParams, WalletBalance} from "../types";
import { balanceTemplate } from "../templates";

// Exported for tests
export class BalanceAction {
    constructor(private walletProvider: WalletProvider) {}

    async getBalance(params: GetBalanceParams): Promise<WalletBalance> {
        console.log(
            `query balance: ${params.address} (${params.token} tokens on ${params.chain})`
        );

        if (!params.token) {
            params.token = "0x";
        }

        this.walletProvider.switchChain(params.chain);

        try {
            const balance = await this.walletProvider.getWalletBalance(params.address);

            return {
                chain: params.chain,
                address: params.address,
                amount: balance,
                tokens: []
            };
        } catch (error) {
            throw new Error(`Query Balance failed: ${error.message}`);
        }
    }
}

const buildGetBalanceDetails = async (
    state: State,
    runtime: IAgentRuntime,
    wp: WalletProvider
): Promise<GetBalanceParams> => {
    const context = composeContext({
        state,
        template: balanceTemplate,
    });

    const chains = Object.keys(wp.chains);

    const contextWithChains = context.replace(
        "SUPPORTED_CHAINS",
        chains.map((item) => `"${item}"`).join("|")
    );

    const transferDetails = (await generateObjectDeprecated({
        runtime,
        context: contextWithChains,
        modelClass: ModelClass.SMALL,
    })) as GetBalanceParams;

    const existingChain = wp.chains[transferDetails.chain];

    if (!existingChain) {
        throw new Error(
            "The chain " +
            transferDetails.chain +
            " not configured yet. Add the chain or choose one from configured: " +
            chains.toString()
        );
    }

    return transferDetails;
};

export const balanceAction = {
    name: "balance",
    description: "Get balance tokens by addresses on the chain",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        state: State,
        _options: any,
        callback?: HandlerCallback
    ) => {
        console.log("Balance action handler called");
        const walletProvider = initWalletProvider(runtime);
        const action = new BalanceAction(walletProvider);

        // Compose transfer context
        const paramOptions = await buildGetBalanceDetails(
            state,
            runtime,
            walletProvider
        );

        try {
            const getBalanceResp = await action.getBalance(paramOptions);
            if (callback) {
                callback({
                    text: `Successfully query balance ${paramOptions.address} (${paramOptions.token} tokens on ${paramOptions.chain}. Amount: ${getBalanceResp.amount}`,
                    content: {
                        success: true,
                        amount: getBalanceResp.amount,
                        address: getBalanceResp.address,
                        chain: paramOptions.chain,
                    },
                });
            }
            return true;
        } catch (error) {
            console.error("Error during get balance:", error);
            if (callback) {
                callback({
                    text: `Error get balance: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },
    template: balanceTemplate,
    validate: async (runtime: IAgentRuntime) => {
        const privateKey = runtime.getSetting("EVM_PRIVATE_KEY");
        return typeof privateKey === "string" && privateKey.startsWith("0x");
    },
    examples: [
        [
            {
                user: "assistant",
                content: {
                    text: "I'll help you query your ETH balance.",
                    action: "QUERY_BALANCE",
                },
            },
            {
                user: "user",
                content: {
                    text: "query 0x742d35Cc6634C0532925a3b844Bc454e4438f44e ETH balance",
                    action: "QUERY_BALANCE",
                },
            },
        ],
    ],
    similes: ["QUERY_BALANCE"],
};
