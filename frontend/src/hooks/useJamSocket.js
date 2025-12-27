import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const useJamSocket = ({
  setSocket,
  jamCode,
  nickname,
  userId,
  onRemoteStroke,
  onPlayerJoin,
  onPlayerLeave,
}) => {
  useEffect(() => {
    if (!jamCode || !nickname) return;

    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
    });
    setSocket(newSocket);

    newSocket.emit("join-jam", { code: jamCode, nickname, userId });

    newSocket.on("jam-player-joined", (data) => {
      toast.info(`${data.nickname} joined the jam!`);
      if (onPlayerJoin) onPlayerJoin(data);
    });

    newSocket.on("jam-player-left", (data) => {
      toast.info(`${data.nickname} left the jam`);
      if (onPlayerLeave) onPlayerLeave(data);
    });

    newSocket.on("jam-draw-stroke", (data) => {
      if (onRemoteStroke) onRemoteStroke(data.stroke);
    });

    return () => {
      newSocket.emit("leave-jam", { code: jamCode, nickname });
      newSocket.disconnect();
    };
  }, [jamCode, nickname, userId]);
};
