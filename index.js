const express = require("express")
const app = express()
const http = require("http").Server(app)
const cors = require("cors")
const PORT = 4000
const socketIO = require("socket.io")(http, {
  cors: {
    origin: "http://localhost:3000",
  },
})

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(cors())

const generateID = () => Math.random().toString(36).substring(2, 10)
let chatRooms = []

const generateRoomId = (userA, userB) => {
  if (userA > userB) {
    return userB + userA;
  }
  else
    return userA + userB;
}

socketIO.on("connection", (socket) => {
  console.log(`⚡: ${socket.id} user just connected!`)

  socket.on("createRoom", (data) => {
    const roomId = generateRoomId(data.userA, data.userB)
    console.log("create Room , name = ", roomId)
    socket.join(roomId)
    chatRooms.unshift({ id: roomId, name: roomId, userA: userA, userB: userB, messages: [] })
    socket.emit("roomsList", chatRooms)
    console.log("roomsList = ", chatRooms)
  })

  socket.on("findRoom", (data) => {
    const roomId = generateRoomId(data.userA, data.userB)
    let result = chatRooms.filter((room) => room.id == roomId)
    console.log("result findRoom", result)
    if (result && result.length > 0) {
      socket.emit("foundRoom", result[0].messages)
    }
  })

  socket.on("findRoomList", (data) => {
    let result = chatRooms.filter((room) => room.id.includes(data.userA))
    if (result && result.length > 0) {
      socket.emit("foundRoom", result[0].messages)
    }
  })

  socket.on("newMessage", (data) => {
    const { message, userA, userB, timestamp } = data
    const room_id = generateRoomId(userA, userB)
    let result = chatRooms.filter((room) => room.id == room_id)
    if (result.length == 0) {
      socket.join(room_id)
      chatRooms.unshift({ id: room_id, name: room_id, userA: userA, userB: userB, messages: [] })
      socket.emit("roomsList", chatRooms)
    }
    result = chatRooms.filter((room) => room.id == room_id)
    const newMessage = {
      id: generateID(),
      text: message,
      from: userA,
      to: userB,
      time: `${timestamp.hour}:${timestamp.mins}`,
    }
    socketIO.to(result[0].name).emit("roomMessage", newMessage)
    result[0].messages.push(newMessage)

    socketIO.emit("roomsList", chatRooms)
    socketIO.emit("foundRoom", result[0].messages)
    console.log("Emit foundRoom  ", result[0].messages)
  })
  socket.on("disconnect", () => {
    socket.disconnect()
    console.log("🔥: A user disconnected")
  })
})

app.get("/api", (req, res) => {
  res.json(chatRooms)
})

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
