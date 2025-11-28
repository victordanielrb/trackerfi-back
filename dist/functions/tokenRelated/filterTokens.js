"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = filterTokens;
function filterTokens(tokens) {
    // Filter out tokens with quantity 0 or symbol 'Unknown'    
    const tokensByChain = {};
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
