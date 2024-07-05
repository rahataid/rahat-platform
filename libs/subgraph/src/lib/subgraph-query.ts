import { Client } from "@urql/core";
import { TokenDetail, TokenTransfers, TokensTransfers } from "./queries";


export class GraphQuery {
    private subgraphQuery: Client;

    constructor(client: Client) {
        this.subgraphQuery = client
    }

    async getTokenDetails() {
        const { data, error } = await this.subgraphQuery.query(TokenDetail, {})
        return { ...data.tokenDetails, error }
    }

    async getTokensTransfers() {
        const { data, error } = await this.subgraphQuery.query(TokensTransfers, {});
        return { ...data.tokensTransfers, error }

    }

    async getTokenTransfers(tokenAddress: String) {
        const { data, error } = await this.subgraphQuery.query(TokenTransfers, { tokenAddress });
        return { ...data.tokenTransfers, error }


    }
}