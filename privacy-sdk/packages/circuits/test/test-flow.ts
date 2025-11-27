// packages/privacy-mixer/test/test-flow.ts

import { PrivacyMixer, Denomination } from '../src'; 

async function main() {
  const mixer = new PrivacyMixer();
  console.log("--- Test Flow Started ---");

}

main().catch(err => console.error(err));