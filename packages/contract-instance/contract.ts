import { contracts, testAzero } from "@polkadot-api/descriptors";
import { createInkSdk } from "@polkadot-api/sdk-ink";
import { createClient } from "polkadot-api";
import { withPolkadotSdkCompat } from "polkadot-api/polkadot-sdk-compat";
import { getWsProvider } from "polkadot-api/ws-provider/web";

import { CONTRACT_ADDRESS, RPC_URL } from "./config";

const client = createClient(withPolkadotSdkCompat(getWsProvider(RPC_URL)));
const typedApi = client.getTypedApi(testAzero);
const courseManagementSdk = createInkSdk(typedApi, contracts.course_management);
export const contractInstance =
  courseManagementSdk.getContract(CONTRACT_ADDRESS);
