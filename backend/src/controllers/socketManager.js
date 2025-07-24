import { Server } from "socket.io";
let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
  const io = new Server(server, {
    cors:{ //
        origin: "*",//
        methods: ["GET", "POST"], // only for testing because we send from anywhere dont do for production
        allowedHeaders: ["*"], //
        credentials: true//
    }
  });

  //for joining a call 
  io.on("connection", (socket) => {
    socket.on("join-call", (path) => {
      if (connections[path] === undefined) {
        connections[path] = [];
      }
      connections[path].push(socket.id);
      timeOnline[socket.id] = new Date();

      //   connections[path].forEach((elem) => {
      //     io.to(elem)
      //   })
    
      // user joined 
      for (let a = 0; a < connections[path].length; i++) { // same thing mentioned above from forEach loop
        io.to(connections[path][a]).emit(
          "user-joined",
          socket.id,
          connections[path]
        );
      }
      // chat message
      if (messages[path] !== undefined) {
        for (let a = 0; a < messages[path].length; ++a) {
          io.to(socket.id).emit(
            "chat-message",
            messages[path][a]["data"],
            messages[path][a]["sender"],
            messages[path][a]["socket-id-sender"]
          );
        }
      }
    });
    socket.on("signal", (toId, message) => {
      io.to(toId).emit("signal", socket.id, message);
    })
    socket.on("chat-message", (data, sender) => {
      const [matchingRoom, found] = Object.entries(connections).reduce(([room, isFound], [roomKey, roomValue]) => {
        if (!isFound && roomValue.includes(socket.id)) {
            return [roomKey, true];
        }
        return [room, isFound];
      }, ['', false]);
      if(found === true) {
        if (messages[matchingRoom] === undefined) {
            messages[matchingRoom] = []
        }
        messages[matchingRoom].push({'sender': sender, "data": data, "socket-id-sender": socket.id})
        console.log("message", key, ":", sender, data )
            connections[matchingRoom].forEach((elem) => {
                io.to(elem).emit("chat-message", data, sender, socket.id)
            })
        }
      
    })

    //call disconnect 
    socket.on("disconnnect", () => {
        var diffTime = Math.abs(timeOnline[socket.id] - new Date())
        var key
        for(const [k, v] of JSON.parse(JSON.stringify(Object.entries(connections)))) {
            for (let a = 0; a < v.length; ++a) {
                if(v[a] === socket.id) {
                    key = k
                    for (let a = 0; a < connections[key].length; ++a) {
                        io.to(connections[key][a]).emit('user-left', socket.id)
                    }
                    var index = connections[key].indexOf(socket.id)
                    connections[key].splice(index, 1)

                    if(connnections[key].length === 0) {
                        delete connections[key]
                    }
                }
            }
        }
    });
  });

  return io;
};
