const { randomUUID } = require("crypto")
const { ChatRoom, Message } = require("../../models/chat.model")

const initiateChat = async function (data, res) {
    try {
        const socket = this;
        const { targetuser_id, ride_id } = data;

        // Check if ride exists
        const ride = await Ride.findById(ride_id);
        if (!ride) { res("Ride does not exist"); return; }

        // Check if user is part of ride
        if (ride.rider != socket.user._id && 
            ride.passenger != socket.user._id) {
            res("User is not part of ride");
            return;
        }

        // Check if an existing chat room exists
        const chat_room = await ChatRoom.findOne({
            users: { $all: [socket.user._id, data.targetuser_id] },
            ride_id
        });

        // If chat room exists, notify initiator of chat room id
        if (chat_room) {
            res(null, { chat_room_id: chat_room._id });
            return;
        }

        // If chat room does not exist, create new chat room
        const new_chat_room = await ChatRoom.create({
            users: [socket.user._id, data.targetuser_id],
            ride_id,
            messages: [],
        }),
        chat_room_id = new_chat_room._id;

        // Notify target user of chat room id
        io.to(targetuser_id).emit("chat:invite", { chat_room_id });

        // Notify initiator of chat room id
        res(null, { chat_room_id });

        return;
    } catch (error) {
        res(error)
        return
    }
}

const sendMsg = async function (data, res) {
    try {
        const socket = this
        const { chat_room_id, message } = data

        // Check if chat room exists
        const chat_room = await ChatRoom.findById(chat_room_id)
        if (!chat_room) {
            res('Chat room does not exist')
            return
        }

        // Check if user is part of chat room
        const user_in_chat_room = chat_room.users.includes(socket.user._id)
        if (!user_in_chat_room) {
            res('User is not part of chat room')
            return
        }

        // Create new message
        const new_message = await Message.create({
            sender: socket.user._id,
            chat_room: chat_room_id,
            message,
        })

        // Add new message to chat room
        chat_room.messages.push(new_message._id)
        await chat_room.save()

        // Notify all users in chat room of new message
        io.to(chat_room_id).emit('chat:message', { message: new_message })

        res(null, { message: new_message })
        return
    } catch (error) {
        res(error)
        return
    }
}

const getChatRoom = async function (data, res) {
    try {
        const socket = this
        const { chat_room_id } = data

        // TODO: Check if user is part of chat room before getting messages
        // TODO: Check if user is part of chat room ride before getting messages
        // TODO: Check if ride is active before getting messages

        // Check if chat room exists
        const chat_room = await ChatRoom.findById(chat_room_id)
        if (!chat_room) { res('Chat room does not exist'); return }

        // Check if user is part of chat room
        const user_in_chat_room = chat_room.users.includes(socket.user._id)
        if (!user_in_chat_room) { res('User is not part of chat room'); return }

        // Get all messages in chat room
        const messages = await Message.find({ _id: { $in: chat_room.messages } })

        res(null, { messages })
        return
    } catch (error) {
        res(error)
        return
    }
}

module.exports = (io, socket) => {
    const res = (error, data) => {
        if (error) {
            socket.emit('location:error', { error });
        } else {
            socket.emit('location:success', { data });
        }
    }

    socket.on('chat:initiate', (data) => initiateChat(data, res));
    socket.on('chat:send-message', (data) => sendMsg(data, res));
    socket.on('chat:get-messages', (data) => getChatRoom(data, res));
}
