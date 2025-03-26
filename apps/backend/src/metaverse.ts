import { Elysia, t } from "elysia";
import { MetaverseMessage } from "./types";
import User from "./User";
import RoomManager from "./roomManager";
import { verifyRoomAccess } from "./utils";
import { verifySignature, createSession, AuthenticatedRequest } from "./auth";

const metaverse = new Elysia()
  // Authentication endpoint
  .post("/auth", ({ body }) => {
    const { address, signature, message } = body as AuthenticatedRequest;

    if (verifySignature(message, signature, address)) {
      createSession(address);
      return { success: true };
    }
    return { success: false, error: "Invalid signature" };
  })

  // Room creation endpoint
  .post("/room", ({ body }) => {
    const { roomId } = body as { roomId: string };
    RoomManager.createRoom(roomId);
    return { success: true };
  })

  .ws("/metaverse", {
    schema: {
      body: t.Object({
        action: t.Enum({
          Move: "move",
          Chat: "chat",
          Join: "join",
          Leave: "leave",
        }),
        data: t.Object({
          userId: t.String(),
          roomId: t.String(),
          message: t.Optional(t.String()),
          position: t.Optional(
            t.Object({
              x: t.Number(),
              y: t.Number(),
            }),
          ),
          signature: t.Optional(t.String()),
        }),
      }),
      response: t.Object({
        action: t.String(),
        userId: t.String(),
        message: t.Optional(t.String()),
        position: t.Optional(
          t.Object({
            x: t.Number(),
            y: t.Number(),
          }),
        ),
        color: t.Optional(t.String()),
        roomId: t.String(),
        users: t.Optional(t.Array(t.Any())),
      }),
    },
    async message(ws, message) {
      try {
        const { action, data } = message as MetaverseMessage;

        if (!data || !data.userId || !data.roomId) {
          console.error("Invalid message data");
          return;
        }

        // Verify access for all actions
        const hasAccess = await verifyRoomAccess(data.userId, data.roomId);
        if (!hasAccess) {
          ws.send({
            action: "error",
            message: "Access denied",
            userId: data.userId,
            roomId: data.roomId,
          });
          return;
        }

        switch (action) {
          case "join": {
            const user = new User(data.userId, ws);
            const users = RoomManager.joinRoom(data.roomId, user);
            if (users !== null) {
              ws.subscribe(data.roomId);
              ws.publish(data.roomId, {
                action: "join",
                userId: data.userId,
                roomId: data.roomId,
                message: `User ${data.userId} joined`,
                users: users.map((u) => u.toJSON()),
              });
            }
            break;
          }

          case "move": {
            if (!data.position) return;
            RoomManager.updateUserPosition(
              data.roomId,
              data.userId,
              data.position,
            );
            ws.publish(data.roomId, {
              action: "move",
              userId: data.userId,
              position: data.position,
              roomId: data.roomId,
            });
            break;
          }

          case "chat": {
            if (!data.message) return;
            ws.publish(data.roomId, {
              action: "chat",
              userId: data.userId,
              message: data.message,
              roomId: data.roomId,
            });
            break;
          }

          case "leave": {
            const users = RoomManager.leaveRoom(data.roomId, data.userId);
            ws.unsubscribe(data.roomId);
            ws.publish(data.roomId, {
              action: "leave",
              userId: data.userId,
              roomId: data.roomId,
              message: `User ${data.userId} left`,
              users: users.map((u) => u.toJSON()),
            });
            break;
          }
        }
      } catch (error) {
        console.error("Error handling message:", error);
      }
    },
  })
  .listen(3000);

console.log(
  `Metaverse WebSocket server is running on ws://localhost:${metaverse.server?.port}/metaverse`,
);

export default metaverse;
