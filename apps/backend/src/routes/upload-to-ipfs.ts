import { Elysia, t } from "elysia";
import { pinata } from "../../lib/pinata";

const ipfs = new Elysia({ prefix: "/ipfs" })
  .post(
    "/image",
    async ({ body, set }) => {
      try {
        const file = body.file;

        if (!file) {
          set.status = 400;
          return { error: "No image file provided" };
        }

        const upload = await pinata.upload.public.file(file);
        const url = await pinata.gateways.public.convert(upload.cid);

        return {
          success: true,
          cid: upload.cid,
          url,
        };
      } catch (error) {
        console.error("Image upload failed:", error);
        set.status = 500;
        return { error: "Failed to upload image" };
      }
    },
    {
      body: t.Object({ file: t.File() }),
    },
  )
  .post(
    "/materials",
    async ({ body, set }) => {
      try {
        const files = body.files;

        if (!files || files.length === 0) {
          set.status = 400;
          return { error: "No files provided" };
        }

        const upload = await pinata.upload.public.fileArray(files);
        const url = await pinata.gateways.public.convert(upload.cid);

        return {
          success: true,
          cid: upload.cid,
          url,
        };
      } catch (error) {
        console.error("Material upload failed:", error);
        set.status = 500;
        return { error: "Failed to upload course materials" };
      }
    },
    {
      body: t.Object({ files: t.Array(t.File()) }),
    },
  );

export default ipfs;
