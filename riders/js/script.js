const alert_window = document.querySelector('.alert');
const alert_close = document.querySelector('.btn-close');

window.onload = () => {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

function show_alert() {
    console.log('show alert')
    alert_window.classList.remove('hide')
    alert_window.classList.add('show');

    const yes_btn = document.querySelector('.yes');
    const no_btn = document.querySelector('.no');

    yes_btn.addEventListener('click', () => {
        socket.emit('ride:accepted', { accepted: true });
        close_alert();
    })
    no_btn.addEventListener('click', () => {
        socket.emit('ride:rejected', { accepted: false });
        close_alert();
    })
    alert_close.addEventListener('click', () => {
        close_alert();
    });
}

function close_alert() {
    alert_window.classList.add('hide');
    alert_window.classList.remove('show');
}

const init_chat = document.querySelector('.initiate-chat');
const send_message = document.querySelector('.send-message');
const message_content = document.querySelector('.message-content');
const target_email = document.querySelector('.target-mail');

const api_url = 'http://localhost:5000/api/v1';
let chat_room_id = null;

function sendMessageResponseHandler(data) {
    console.log('message sent', data)
}
socket.on('reponse:chat:message:new', sendMessageResponseHandler);
send_message.addEventListener('click', () => {
    socket.emit('chat:message:new', {
        message: message_content.value,
        chat_room_id
    });
});

// Chat room 
{
    function saveChatRoomIdToStorage(room_id) {
        localStorage.setItem(email + ':chat_room_id', room_id);
    }

    function getChatRoomIdFromStorage() {
        const stored_room_id = localStorage.getItem(email + ':chat_room_id');
        return stored_room_id
    }

    function chatInviteHandler(data) {
        const { chat_room_id } = data
        console.log('New chat room invite: ', chat_room_id)
        saveChatRoomIdToStorage(chat_room_id)
    }

    function getMessagesHandler(data) {
        console.log('Get messages handler')
        const { messages } = data
        console.log(messages)
    }

    function newChatRoomMessgeHandler(data) {
        console.log('New chat room message')
        const { message } = data
        console.log(message.sender.email + ': ' + message.message)
    }

    socket.on('response:chat:invite', chatInviteHandler)

    // socket.emit('chat:message:get-all', { chat_room_id })
    console.log(chat_room_id + ':chat:message:new')
    socket.on(chat_room_id + ':chat:message:new', newChatRoomMessgeHandler)
    if (!socket.hasListeners("63eff9c4ffb90fdf2503c522:chat:message:new")) {
    }
}


function initiateChatResponseHandler(data) {
    console.log('intiating chat')
    chat_room_id = data.data.chat_room_id;

    saveChatRoomIdToStorage(chat_room_id)

    console.log('chat room id: ', chat_room_id)

    if (!socket.hasListeners(chat_room_id + ':chat:message:new')) {
        console.log('listener exists')
        socket.on(chat_room_id + ':chat:message:new', newChatRoomMessgeHandler);
    } else { console.log('listener does not exist') }
}
socket.on('response:chat:initiate', initiateChatResponseHandler);
init_chat.addEventListener('click', async function () {
    console.log('init chat')
    const response = await axios.get(api_url + '/user/user-data', {
        params: {
            target_email: target_email.value
        }
    })

    const { data } = response;
    const user_data = data.data.user;

    console.log(user_data)
    socket.emit('chat:initiate', {
        targetuser_id: user_data._id
    });
});
