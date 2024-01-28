const express = require("express");
const app = express();
const http = require("http").Server(app);
const cors = require("cors");
const PORT = 4000;
const socketIO = require("socket.io")(http, {
	cors: {
		origin: "http://localhost:3000",
	},
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

const generateID = () => Math.random().toString(36).substring(2, 10);
let chatRooms = [];

socketIO.on("connection", (socket) => {
	console.log(`⚡: ${socket.id} user just connected!`);

	socket.on("createRoom", (room) => {
		console.log("create Room , name = ", room.name);
		socket.join(room.name);
		chatRooms.unshift({ id: room.id, name: room.name, messages: [] });
		socket.emit("roomsList", chatRooms);
		console.log("roomsList = ", chatRooms);
	});

	socket.on("findRoom", (id) => {
		let result = chatRooms.filter((room) => room.id == id);
		console.log("result", result);
		if (result && result.length > 0) {
			socket.emit("foundRoom", result[0].messages);
			console.log("Messages Form", result[0].messages);
		}
	});

	socket.on("newMessage", (data) => {
		const { room_id, message, user, timestamp } = data;
		let result = chatRooms.filter((room) => room.id == room_id);
		const newMessage = {
			id: generateID(),
			text: message,
			user,
			time: `${timestamp.hour}:${timestamp.mins}`,
		};
		socketIO.to(result[0].name).emit("roomMessage", newMessage);
		result[0].messages.push(newMessage);

		socketIO.emit("roomsList", chatRooms);
		console.log("Emit roomsList  ", chatRooms);
		socketIO.emit("foundRoom", result[0].messages);
		console.log("Emit foundRoom  ", result[0].messages);
	});
	
	socket.on("newMessage2", (data) => {
		const { message, user, timestamp } = data;
	
		socketIO.emit("new message", message);
		console.log("new message:  ", message);
	});
	socket.on("disconnect", () => {
		socket.disconnect();
		console.log("🔥: A user disconnected");
	});
});

app.get("/api", (req, res) => {
	res.json(chatRooms);
});

http.listen(PORT, () => {
	console.log(`Server listening on ${PORT}`);
});
