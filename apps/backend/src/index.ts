import { Elysia } from "elysia";
import ipfs from "./routes/upload-to-ipfs";
import metaverse from "./routes/metaverse-ws";

const app = new Elysia().use(metaverse).use(ipfs).listen(3000);
console.log(`Server is running on http://localhost:${app.server?.port}`);
