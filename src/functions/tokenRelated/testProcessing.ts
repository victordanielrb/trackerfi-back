import { testTokenProcessing } from './processWalletTokens';

// Run the test
testTokenProcessing().then(() => {
  console.log('\n✅ Test completed!');
}).catch(error => {
  console.error('❌ Test failed:', error);
});
