const { randomUUID } = require("crypto")
const { ChatRoom, Message } = require("../../models/chat.model")
const { Ride } = require("../../models/ride.model")
const { clients } = require("../clients")
const { User } = require("../../models/users.model")
const { errorMonitor } = require("events")

async function addUserToRoom(user_socket, room_id) {
    room_id = room_id.toString()
    // Check if user is alread in room 
    if (!(room_id in user_socket.rooms)) {
        console.log(user_socket.rooms)
        console.log('adding user to rooms')
        user_socket.join(room_id)
    }
}

async function inviteTargetUserToChatRoom(target_user_id, room_id) {
    try {
        console.log("inviting user to join chat")
        const target_user_data = await User.findById(target_user_id);

        console.log(target_user_id)
        console.log(target_user_data)

        const target_client = clients.get(target_user_data.email)
        if (target_client) {
            addUserToRoom(target_client, room_id)
            target_client.emit("chat:invite", { chat_room_id: room_id });
        } 
        else { console.log('Target user not connected'); }

        return;

    } catch (error) {
        console.log(errorMonitor)
    }
}


const initiateChat = async function (req, res) {
    try {
        const { data } = req
        console.log('initiateChat')
        const socket = this;
        const { targetuser_id, ride_id } = data;

        // Check for missing requred fields
        // if (!targetuser_id) { res("Missing required field: targetuser_id"); return; }

        // Check if ride exists
        // const ride = await Ride.findById(ride_id);
        // if (!ride) { res("Ride does not exist"); return; }

        // // Check if user is part of ride
        // if (ride.rider != socket.user._id &&
        //     ride.passenger != socket.user._id) {
        //     res("User is not part of ride");
        //     return;
        // }

        // // Check if an existing chat room exist
        const chat_room = await ChatRoom.findOne({
            users: { $all: [socket.user._id, data.targetuser_id] },
            // ride_id
        });

        // If chat room exists, notify initiator of chat room id
        // and invite target user to chat room
        if (chat_room) {
            addUserToRoom(socket, chat_room._id)
            inviteTargetUserToChatRoom(targetuser_id, chat_room._id)
            res.send(null, { chat_room_id: chat_room._id });
            return;
        }

        // If chat room does not exist, create new chat room
        const new_chat_room = await ChatRoom.create({
            users: [socket.user._id, data.targetuser_id],
            // ride_id,
            messages: [],
        }),
            chat_room_id = new_chat_room._id;

        addUserToRoom(socket, chat_room._id)

        // Invite target user to chat room
        inviteTargetUserToChatRoom(targetuser_id, chat_room_id)

        // Notify initiator of chat room id
        res.send(null, { chat_room_id });

        return;
    } catch (error) {
        res.send(error)
        return;
    }
}

const sendMsg = async function (req, res) {
    try {
        const socket = this
        const { chat_room_id, message } = req.data

        // Check if chat room exists
        const chat_room = await ChatRoom.findById(chat_room_id).populate('messages')
        if (!chat_room) {
            res.send('Chat room does not exist')
            return
        }

        // Check if user is part of chat room
        const user_in_chat_room = chat_room.users.includes(socket.user._id)
        if (!user_in_chat_room) {
            res.send('User is not part of chat room')
            return
        }

        // Create new message
        const new_message = await Message.create({
            sender: socket.user._id,
            chat_room: chat_room_id,
            message,
        })

        const populate_config = {
            path: 'sender',
            select: 'firstname lastname email'
        }
        console.log(await new_message.populate(populate_config))

        let path = chat_room_id + ':chat:message:new'
        console.log(path)
        console.log(socket.rooms)


        // socket.emit(path, { message: new_message })
        // socket.io.to(chat_room_id).emit(path, { message: new_message })
        socket.io.to(chat_room_id).emit(path, { message: new_message })
        // // Notify all users in chat room of new message
        // const chat_room_client = clients.get(chat_room_id)
        // if (chat_room_client) chat_room_client.emit('chat:message', { message: new_message })
        res.send(null, { message: new_message })
        return
    } catch (error) {
        console.log(error)
        res.send(error)
        return
    }
}

const getChatRoomMessages = async function (data, res) {
    try {
        const socket = this
        const { chat_room_id } = data

        // TODO: Check if user is part of chat room before getting messages
        // TODO: Check if user is part of chat room ride before getting messages
        // TODO: Check if ride is active before getting messages

        // Check if chat room exists
        const chat_room = await ChatRoom.findById(chat_room_id)
        if (!chat_room) { res.send('Chat room does not exist'); return }

        // Check if user is part of chat room
        const user_in_chat_room = chat_room.users.includes(socket.user._id)
        if (!user_in_chat_room) { res.send('User is not part of chat room'); return }

        // Get all messages in chat room
        const messages = await Message.find({ _id: { $in: chat_room.messages } })

        res.send(null, { messages })
        return
    } catch (error) {
        res.send(error)
        return
    }
}

module.exports = (io, socket) => {
    try {
        const res = new Map()
        res.send = (error, data) => {
            const response_path = res.path
            const response_data = { error, data }

            if (error) console.log(error);

            socket.emit(response_path, response_data)
        }

        function socketHandlerMiddleware(data, path) {
            const socket = this;
            socket.io = io
            const socketRequestHandler = socket_paths[path];
            const req = { user: socket.user, data, path }
            res.path = 'response:' + path;

            if (socket.user) return socketRequestHandler.call(socket, req, res);
            res.send(res.path, { error: 'User is not authenticated' })
        }

        const socket_paths = {
            "chat:initiate": initiateChat,
            "chat:message:new": sendMsg,
            "chat:message:get-all": getChatRoomMessages,
        };

        socket.on("chat:initiate",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:initiate"));
        socket.on("chat:message:new",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:message:new"));
        socket.on("chat:message:get-all",
            (data) => socketHandlerMiddleware.call(socket, data, "chat:message:get-all"));

    } catch (error) {
        console.log(error)
    }
}
