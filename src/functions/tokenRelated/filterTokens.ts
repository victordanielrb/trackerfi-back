import TokensFromWallet from "../../interfaces/tokenInterface";

export default function filterTokens(tokens: TokensFromWallet[]) {
    // Filter out tokens with quantity 0 or symbol 'Unknown'    
    const tokensByChain: { [key: string]: TokensFromWallet[] } = {};
    tokens.forEach(token => {
        if (token.symbol !== 'Unknown') {
            if (!tokensByChain[token.chain]) {
                tokensByChain[token.chain] = [];
            }
            tokensByChain[token.chain].push(token);
        }
    });
    console.log(tokensByChain);
    return tokensByChain;
}