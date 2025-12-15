import { Server as IOServer } from 'socket.io'

declare global {
  // eslint-disable-next-line no-var
  var _io: IOServer | undefined
}

export function setIO(io: IOServer) {
  global._io = io
}

export function getIO(): IOServer | undefined {
  return global._io
}

