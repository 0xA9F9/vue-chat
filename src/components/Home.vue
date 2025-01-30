<template>
  <div v-if="loading" class="loading">
    <div class="loader"></div>
  </div>
  <div v-else class="chat-c">
    <div class="chat-container" @click="hideContextMenu">
      <div class="chat-inner">
        <div class="top">
          <b>{{ userName }}</b>
          <div class="search-container">
            <input v-model="searchQuery" type="text" placeholder="Поиск сообщений" class="search-bar" />
          </div>
          <button @click="logout" class="material-symbols-outlined logout">logout</button>
        </div>
        <div class="messages" ref="messagesContainer" @scroll="handleScroll">
          <div v-for="message in displayedMessages" :key="message.id" class="message" :id="message.id" @contextmenu.prevent="handleContextMenu($event, message)" @touchstart="handleTouchStart($event, message)" @touchend="handleTouchEnd" @touchcancel="handleTouchCancel" @click="toggleSelectMessage(message.id, message)" :class="{ 
              selected: isSelecting && selectedMessages.includes(message.id),
              'deletable': isSelecting && canDelete(message.id),
              'cursor-not-allowed': isSelecting && !canDelete(message.id)
            }">
            <img :src="getUserAvatar(message.uid)" class="avatar" alt="avatar">
            <a :href="'#' + message.id" @click.stop="showSingleMessage(message.id)" class="nick">{{ getUserNickname(message.uid) }}</a>
            <span class="date">{{ formatTimeDifference(message.timestamp) }}</span>
            <div class="msg">
              <span class="nickname" v-if="message.replyTo" @click="scrollToMessage(message.replyTo)"> @{{ getUserNickname(replyMessages[message.replyTo]?.uid) || 'Неизвестный' }}, </span>
              <div v-if="editingMessageId === message.id" class="edit-section">
                <div contenteditable="true" ref="editDiv" @input="handleEditInput" :data-id="message.id" required class="edit-input">
                  {{ editableMessageText }}
                </div>
                <div class="edit-buttons">
                  <button type="button" @click="cancelEdit" class="btn cancel-btn">Отмена</button>
                  <button type="button" @click="saveEdit(message.id)" class="btn save-btn">Сохранить</button>
                </div>
              </div>
              <span v-else>
                <template v-if="message.text.length > 500 && !showFullMessage[message.id]">
                  {{ message.text.slice(0,500) }}... <span class="more" @click="showFull(message.id)">Читать дальше</span>
                </template>
                <template v-else>
                  {{ message.text }}
                </template>
              </span>
            </div>
          </div>
        </div>
        <div v-if="contextMenuVisible" class="context-menu" :style="{
            position: 'absolute',
            top: contextMenuY + 'px',
            left: contextMenuX + 'px',
            background: '#fff',
            border: '1px solid var(--color-4)',
            padding: '5px',
            borderRadius: '5px',
            zIndex: 1000
          }">
          <div class="context-menu-content">
            <!-- Пункт "Ответить" -->
            <span class="hs context-menu-item" @click="replyTo(contextMenuMessageId)">
              <span class="material-symbols-outlined"> reply </span> Ответить </span>
            <span class="hs context-menu-item" v-if="canEdit(contextMenuMessageId)" @click="startEdit(contextMenuMessageId, contextMenuMessageText)">
              <span class="material-symbols-outlined"> edit </span> Редактировать </span>
            <span class="hs context-menu-item" v-if="!isSelecting && (isAdmin || canDelete(contextMenuMessageId))" @click="toggleSelecting">
              <span class="material-symbols-outlined"> clear_all </span> Выбрать </span>
            <hr>
            <span class="hs context-menu-item save" v-if="isSelecting" @click="exitDeleteMode">
              <span class="material-symbols-outlined"> close </span> Отменить </span>
            <span class="hs context-menu-item close" v-if="canDelete(contextMenuMessageId)" @click="isSelecting ? deleteSelectedMessages() : deleteMessage(contextMenuMessageId)">
              <span class="material-symbols-outlined"> delete </span> Удалить </span>
          </div>
        </div>
        <form @submit.prevent="sendMessage" style=" flex: 0 1; ">
          <div v-if="replyTarget" class="reply-target" @click="scrollToMessage(replyTarget.id)">
            <div class="reply-header"> Ответ: <strong class="reply-user">
                <template v-if="replyLoading"> Загрузка... </template>
                <template v-else>
                  {{ getUserNickname(replyTarget.uid) }}
                </template>
              </strong>
            </div>
            <p class="reply-text">
              <template v-if="replyLoading"> Загрузка... </template>
              <template v-else>
                {{ truncatedMessageText(replyTarget.text, 150) }}
              </template>
            </p>
            <span type="button" @click.stop="clearReply" class="material-symbols-outlined close reply-c" style="font-size:16px;">close</span>
          </div>
          <div class="bottom">
            <img :src="userAvatar" alt="avatar" class="avatar profile" @click="openAvatarModal">
            <div class="editable write" contenteditable="true" @input="handleInput" @keydown="handleKeydown" @paste="handlePaste" ref="editableDiv" :data-placeholder="placeholderText"></div>
            <button type="submit" class="send">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="send-svg">
                <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="showAvatarModal" class="modal-overlay" @click.self="closeAvatarModal">
      <div class="modal">
        <span @click="closeAvatarModal" class="rnd material-symbols-outlined" style="align-self: self-end;">close</span>
        <div class="profile-form">
          <div class="form-group">
            <label for="nickname">Имя пользователя:</label>
            <input type="text" id="nickname" v-model="editedNickname" placeholder="Введите новое имя" class="input-field" />
          </div>
          <div class="form-group">
            <label for="avatar">Аватар (URL):</label>
            <input type="text" id="avatar" v-model="editedAvatar" placeholder="Введите URL аватарки" class="input-field" />
          </div>
          <div class="form-group">
            <label for="new-password">Новый пароль:</label>
            <input type="password" id="new-password" v-model="newPassword" placeholder="Введите новый пароль" class="input-field" />
          </div>
          <div class="form-group" v-if="newPassword.trim().length > 0">
            <label for="current-password">Текущий пароль:</label>
            <input type="password" id="current-password" v-model="currentPassword" placeholder="Введите текущий пароль" class="input-field" />
          </div>
          <label for="delete-confirmation" style="margin-bottom: 7px;">Для удаления профиля введи слово: <b style="color:red">sudo delete</b>
          </label>
          <div class="form-group" style="display: flex;gap: 5px;">
            <div style=" width: 100%; ">
              <input type="text" id="delete-confirmation" v-model="deleteConfirmationText" placeholder="sudo delete" class="input-field" />
            </div>
            <button @click="deleteProfile" class="material-symbols-outlined delete-btn close">delete</button>
          </div>
        </div>
        <div class="modal-actions">
          <button @click="saveProfile" class="save-btn">Сохранить профиль</button>
          <button @click="changePassword" v-if="newPassword" class="btn change-password-btn">Сменить пароль</button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
  import {
    ref,
    onMounted,
    computed,
    watch
  } from 'vue'
  import {
    onAuthStateChanged,
    signOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    deleteUser
  } from 'firebase/auth'
  import {
    auth,
    db
  } from '../firebase.js'
  import {
    useRouter
  } from 'vue-router'
  import {
    ref as dbRef,
    query,
    orderByChild,
    limitToLast,
    startAt,
    endAt,
    get,
    push,
    remove,
    update,
    child,
    onChildAdded,
    onChildChanged,
    onChildRemoved,
    onValue,
    equalTo
  } from 'firebase/database'
  import Fuse from "fuse.js";
  const showMessage = window.showMessage || function(message, type = 'info') {
    alert(`[${type.toUpperCase()}]: ${message}`)
  }
  const router = useRouter()
  const loading = ref(true)
  const user = ref(null)
  const messages = ref([])
  const newMessage = ref('')
  const placeholderText = 'Напиши что-нибудь!'
  const editableDiv = ref(null)
  const editingMessageId = ref(null)
  const editableMessageText = ref('')
  const contextMenuVisible = ref(false)
  const contextMenuX = ref(0)
  const contextMenuY = ref(0)
  const contextMenuMessageId = ref(null)
  const contextMenuMessageText = ref('')
  const contextMenuMessageUser = ref(null)
  const showFullMessage = ref({})
  const replyTarget = ref(null)
  const replyLoading = ref(false)
  const messagesContainer = ref(null)
  let oldestTimestamp = null
  let latestTimestamp = null
  const messagesRef = dbRef(db, 'messages')
  const replyMessages = ref({})
  const selectedMessages = ref([])
  const isSelecting = ref(false)
  const isAdmin = ref(false)
  const searchQuery = ref("")
  const filteredMessages = ref([])
  let fuse = null
  const editedNickname = ref('')
  const editedAvatar = ref('')
  const newPassword = ref('')
  const currentPassword = ref('')
  const deleteConfirmationText = ref('')
  const users = ref({})

  function getUserAvatar(uid) {
    return users.value[uid]?.avatar || 'https://placehold.co/40?text=NO'
  }

  function getUserNickname(uid) {
    return users.value[uid]?.nickname || 'Аноним'
  }
  const userName = computed(() => getUserNickname(user.value?.uid) || user.value?.email || 'Аноним')
  const userAvatar = computed(() => getUserAvatar(user.value?.uid))
  const userNickname = computed(() => {
    if (user.value && user.value.uid && users.value[user.value.uid]) {
      return users.value[user.value.uid].nickname
    }
    return 'Аноним'
  })
  // Переменная для ID сообщения, если отображаем одно сообщение
  const singleMessageId = ref(null);
  // Вычисляем какие сообщения отображать
  const displayedMessages = computed(() => {
    if (singleMessageId.value) {
      const msg = findMessageById(singleMessageId.value)
      return msg ? [msg] : []
    }
    return filteredMessages.value
  })
  async function checkAdmin() {
    if (!user.value) return
    try {
      const adminSnapshot = await get(child(dbRef(db, 'admins'), user.value.uid))
      isAdmin.value = adminSnapshot.exists() && adminSnapshot.val() === true
    } catch (error) {
      console.error("ошибка при проверке администратора:", error)
      showMessage('ошибка при проверке прав администратора !', 'error')
    }
  }
  async function ensureReplyMessage(id) {
    if (!replyMessages.value[id] && id) {
      const msg = await fetchMessageById(id)
      if (msg) {
        replyMessages.value = {
          ...replyMessages.value,
          [id]: msg
        }
      }
    }
  }
  const showAvatarModal = ref(false)

  function openAvatarModal() {
    editedNickname.value = getUserNickname(user.value.uid)
    editedAvatar.value = getUserAvatar(user.value.uid)
    newPassword.value = ''
    currentPassword.value = ''
    showAvatarModal.value = true
  }

  function closeAvatarModal() {
    showAvatarModal.value = false
  }
  async function loadInitialMessages() {
    try {
      const q = query(messagesRef, orderByChild('timestamp'), limitToLast(20))
      const snapshot = await get(q)
      const data = snapshot.val() || {}
      let allMessages = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }))
      allMessages.sort((a, b) => b.timestamp - a.timestamp)
      messages.value = allMessages
      filteredMessages.value = messages.value
      fuse = new Fuse(messages.value, {
        keys: ["text"],
        threshold: 0.3,
      })
      watch(messages, (newMessages) => {
        if (fuse) {
          fuse.setCollection(newMessages)
          performSearch()
        }
      }, {
        deep: true
      })
      if (allMessages.length > 0) {
        oldestTimestamp = allMessages[allMessages.length - 1].timestamp
        latestTimestamp = allMessages[0].timestamp
        allMessages.forEach(msg => {
          if (msg.replyTo) {
            ensureReplyMessage(msg.replyTo)
          }
        })
      }
    } catch (error) {
      console.error("ошибка при загрузке сообщений:", error)
      showMessage('ошибка при загрузке сообщений !', 'error')
    } finally {
      loading.value = false
    }
  }
  async function loadOlderMessages() {
    if (!oldestTimestamp) return false
    try {
      const q = query(messagesRef, orderByChild('timestamp'), endAt(oldestTimestamp - 1), limitToLast(20))
      const snapshot = await get(q)
      const data = snapshot.val() || {}
      let olderMessages = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }))
      if (olderMessages.length === 0) return false
      olderMessages.sort((a, b) => b.timestamp - a.timestamp)
      messages.value = [...messages.value, ...olderMessages]
      oldestTimestamp = messages.value[messages.value.length - 1]?.timestamp || oldestTimestamp
      olderMessages.forEach(msg => {
        if (msg.replyTo) {
          ensureReplyMessage(msg.replyTo)
        }
      })
      return true
    } catch (error) {
      console.error("ошибка при загрузке старых сообщений:", error)
      showMessage('ошибка при загрузке старых сообщений !', 'error')
      return false
    }
  }
  async function fetchMessageById(id) {
    try {
      const singleMsgRef = child(messagesRef, id)
      const snapshot = await get(singleMsgRef)
      if (!snapshot.exists()) return null
      const msgData = {
        id,
        ...snapshot.val()
      }
      return msgData
    } catch (error) {
      console.error(`ошибка при получении сообщения с ID ${id}:`, error)
      showMessage('ошибка при получении сообщения !', 'error')
      return null
    }
  }

  function findMessageById(id) {
    return messages.value.find(m => m.id === id)
  }
  async function loadUsers() {
    try {
      const usersSnapshot = await get(dbRef(db, 'users'))
      users.value = usersSnapshot.val() || {}
      const usersRefAll = dbRef(db, 'users')
      onValue(usersRefAll, (snapshot) => {
        users.value = snapshot.val() || {}
      })
    } catch (error) {
      console.error("ошибка при загрузке пользователей:", error)
      showMessage('ошибка при загрузке пользователей.', 'error')
    }
  }

  function handleScroll() {
    const container = messagesContainer.value
    if (!container) return
    if (container.scrollHeight - container.scrollTop - container.clientHeight < 100) {
      loadOlderMessages()
    }
  }

  function handleInput(e) {
    newMessage.value = e.target.innerText
  }

  function handlePaste(e) {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  }
  async function sendMessage() {
    if (!user.value) return;
    const trimmedMessage = newMessage.value.trim();
    if (trimmedMessage.length < 1) {
      editableDiv.value.style.border = "1px dashed var(--color-8)";
      showMessage('поле не может быть пустым !', 'error');
      setTimeout(() => {
        editableDiv.value.style.border = "";
      }, 2000);
      return;
    }
    const newMsgData = {
      uid: user.value.uid,
      text: trimmedMessage,
      timestamp: Date.now()
    };
    if (replyTarget.value) {
      newMsgData.replyTo = replyTarget.value.id;
    }
    try {
      await push(messagesRef, newMsgData);
      newMessage.value = '';
      if (editableDiv.value) {
        editableDiv.value.innerText = '';
      }
      replyTarget.value = null;
      if (newMsgData.timestamp > latestTimestamp) {
        latestTimestamp = newMsgData.timestamp;
      }
    } catch (error) {
      console.error("ошибка при отправке сообщения:", error)
      showMessage('ошибка при отправке сообщения !', 'error')
    }
  }
  async function logout() {
    try {
      await signOut(auth)
      showMessage('ты вне системы !', 'success')
      router.push('/log')
    } catch (error) {
      console.error("ошибка при выходе:", error)
      showMessage('ошибка при выходе: ' + error.message, 'error')
    }
  }

  function deleteMessage(id) {
    const msgRef = child(messagesRef, id)
    remove(msgRef)
    hideContextMenu()
    showMessage('удалено !', 'success')
  }

  function startEdit(id, text) {
    editingMessageId.value = id
    editableMessageText.value = text
    hideContextMenu()
  }

  function cancelEdit() {
    editingMessageId.value = null
    editableMessageText.value = ''
  }

  function handleEditInput(e) {
    editableMessageText.value = e.target.innerText
  }
  async function saveEdit(id) {
    const msgRef = child(messagesRef, id)
    try {
      await update(msgRef, {
        text: editableMessageText.value
      })
      editingMessageId.value = null
      editableMessageText.value = ''
      showMessage('обновлено !', 'success')
    } catch (error) {
      console.error("ошибка при обновлении сообщения:", error)
      showMessage('ошибка при обновлении сообщения.', 'error')
    }
  }

  function handleContextMenu(e, message) {
    const previousMessageElement = document.getElementById(contextMenuMessageId.value);
    if (previousMessageElement) {
      previousMessageElement.classList.remove('context-open');
    }
    contextMenuMessageId.value = message.id;
    contextMenuMessageText.value = message.text;
    contextMenuMessageUser.value = message.uid;
    contextMenuVisible.value = true;
    const currentMessageElement = document.getElementById(message.id);
    if (currentMessageElement) {
      currentMessageElement.classList.add('context-open');
    }
    const container = e.currentTarget.closest('.chat-inner');
    if (container) {
      const rect = container.getBoundingClientRect();
      contextMenuX.value = e.clientX - rect.left;
      contextMenuY.value = e.clientY - rect.top;
    } else {
      contextMenuX.value = e.clientX;
      contextMenuY.value = e.clientY;
    }
  }

  function hideContextMenu() {
    const currentMessageElement = document.getElementById(contextMenuMessageId.value);
    if (currentMessageElement) {
      currentMessageElement.classList.remove('context-open');
    }
    contextMenuVisible.value = false;
    contextMenuMessageId.value = null;
    contextMenuMessageText.value = '';
    contextMenuMessageUser.value = null;
  }

  function toggleSelecting() {
    isSelecting.value = !isSelecting.value
    if (!isSelecting.value) {
      selectedMessages.value = []
    }
  }

  function exitDeleteMode() {
    isSelecting.value = false
    selectedMessages.value = []
    hideContextMenu()
  }

  function toggleSelectMessage(id, message) {
    if (!isSelecting.value) return
    if (!canDelete(id)) {
      return
    }
    if (selectedMessages.value.includes(id)) {
      selectedMessages.value = selectedMessages.value.filter(msgId => msgId !== id)
    } else {
      selectedMessages.value.push(id)
    }
  }
  async function deleteSelectedMessages() {
    const idsToDelete = [...selectedMessages.value]
    const messagesToDelete = []
    for (const id of idsToDelete) {
      const msg = findMessageById(id)
      if (isAdmin.value || (msg && msg.uid === user.value.uid)) {
        messagesToDelete.push(id)
      } else {
        showMessage(`не удалось удалить сообщение от ${getUserNickname(msg.uid)}`, 'error')
      }
    }
    try {
      const deletePromises = messagesToDelete.map(id => {
        const msgRef = child(messagesRef, id)
        return remove(msgRef)
      })
      await Promise.all(deletePromises)
      showMessage('удалено !', 'success')
      selectedMessages.value = []
      isSelecting.value = false
    } catch (error) {
      console.error('ошибка при удалении выбранных сообщений:', error)
      showMessage('ошибка при удалении сообщений !', 'error')
    }
  }
  let touchedMessage = null
  let touchTimeout = null

function handleTouchStart(event, message) {
  touchedMessage = message;
  const touch = event.touches[0];
  const pageX = touch.pageX;
  const pageY = touch.pageY;

  touchTimeout = setTimeout(() => {
    if (!touchedMessage) return;

    contextMenuMessageId.value = touchedMessage.id;
    contextMenuMessageText.value = touchedMessage.text;
    contextMenuMessageUser.value = touchedMessage.uid;
    contextMenuVisible.value = true;

    const container = messagesContainer.value; // тут ссылку на ваш .messages или .chat-inner
    if (container) {
      const rect = container.getBoundingClientRect();
      // Берём "прокрутку" контейнера
      const scrollLeft = container.scrollLeft || 0;
      const scrollTop  = container.scrollTop  || 0;
      
      const offsetX = pageX - rect.left + scrollLeft;
      const offsetY = pageY - rect.top + scrollTop;

      contextMenuX.value = offsetX;
      contextMenuY.value = offsetY;
    } else {
      contextMenuX.value = pageX;
      contextMenuY.value = pageY;
    }

    const currentMessageElement = document.getElementById(touchedMessage.id);
    if (currentMessageElement) {
      currentMessageElement.classList.add('context-open');
    }

  }, 300);
}


function handleTouchEnd() {
  clearTimeout(touchTimeout);
  touchedMessage = null;
}

function handleTouchCancel() {
  clearTimeout(touchTimeout);
  touchedMessage = null;
  hideContextMenu();
}


  function showFull(id) {
    showFullMessage.value = {
      ...showFullMessage.value,
      [id]: true
    }
  }

  function truncatedMessageText(text, limit) {
    if (!text) return ''
    if (text.length > limit) {
      return text.slice(0, limit) + '...'
    }
    return text
  }
  async function scrollToMessage(id) {
    let el = document.getElementById(id);
    while (!el) {
      const loaded = await loadOlderMessages();
      if (!loaded) {
        const fetched = await fetchMessageById(id);
        if (!fetched) {
          return;
        }
        replyMessages.value = {
          ...replyMessages.value,
          [id]: fetched
        };
      }
      el = document.getElementById(id);
    }
    if (el) {
      el.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      setTimeout(() => {
        el.classList.add('flashing');
        setTimeout(() => {
          el.classList.remove('flashing');
        }, 1200);
      }, 300);
    }
  }
  async function replyTo(id) {
    replyLoading.value = true
    let msg = findMessageById(id)
    if (!msg) {
      msg = await fetchMessageById(id)
      if (!msg) {
        replyLoading.value = false
        return
      }
      replyMessages.value = {
        ...replyMessages.value,
        [id]: msg
      }
    }
    replyTarget.value = {
      id: msg.id,
      text: msg.text,
      uid: msg.uid
    }
    replyLoading.value = false
    hideContextMenu()
  }

  function clearReply() {
    replyTarget.value = null
  }

  function handleKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submitForm()
    }
  }

  function submitForm() {
    sendMessage();
  }

  function formatTimeDifference(e) {
    let t = Math.floor((new Date() - new Date(e)) / 1e3),
      s = Math.floor(t / 60),
      o = Math.floor(s / 60),
      a = Math.floor(o / 24),
      i = Math.floor(a / 7),
      n = Math.floor(a / 30),
      r = Math.floor(a / 365)
    return r > 0 ? 1 === r ? "год назад" : `${r} ${r % 10 >= 2 && r % 10 <= 4 ? "года" : "лет"} назад` : n > 0 ? 1 === n ? "месяц назад" : `${n} ${n % 10 === 1 ? "месяц" : "месяца"} назад` : i > 0 ? 1 === i ? "неделю назад" : `${i} ${i % 10 === 1 ? "неделю" : "недели"} назад` : a > 0 ? 1 === a ? "вчера" : `${a} ${a % 10 === 1 ? "день" : "дня"} назад` : o > 0 ? 1 === o ? "час назад" : `${o} ${o % 10 === 1 ? "час" : "часа"} назад` : s > 0 ? 1 === s ? "минуту назад" : `${s} ${s % 10 === 1 ? "минуту" : "минуты"} назад` : t > 0 ? 1 === t ? "секунду назад" : `${t} ${t % 10 === 1 ? "секунду" : "секунды"} назад` : "только что";
  }

  function canDelete(messageId) {
    const message = findMessageById(messageId)
    return isAdmin.value || (message && message.uid === user.value.uid)
  }

  function canEdit(messageId) {
    const message = findMessageById(messageId)
    return isAdmin.value || (message && message.uid === user.value.uid)
  }

  function showNotification(message) {
    if (Notification.permission === 'granted') {
      new Notification(`Новое сообщение от ${getUserNickname(message.uid)}`, {
        body: message.text.length > 100 ? message.text.slice(0, 100) + '...' : message.text,
        icon: getUserAvatar(message.uid) || 'https://placehold.co/40?text=NO',
        timestamp: message.timestamp
      })
    }
  }

  function performSearch() {
    if (!searchQuery.value.trim()) {
      filteredMessages.value = messages.value;
      return;
    }
    if (fuse) {
      const results = fuse.search(searchQuery.value);
      filteredMessages.value = results.map(result => result.item);
    }
  }
  watch(searchQuery, () => {
    performSearch();
  });

  function getErrorMessage(error) {
    switch (error.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return 'текущий пароль введен неверно !';
      case 'auth/weak-password':
        return 'новый пароль слишком слабый, он должен содержать не менее 6 символов !';
      case 'auth/requires-recent-login':
        return 'войди в систему снова, чтобы сменить пароль !';
      default:
        return 'произошла ошибка: ' + error.message;
    }
  }
  async function reauthenticateUser() {
    if (!user.value) {
      showMessage('не авторизован !', 'error')
      return false
    }
    if (!currentPassword.value) {
      showMessage('введи текущий пароль для подтверждения !', 'error')
      return false
    }
    try {
      const credential = EmailAuthProvider.credential(user.value.email, currentPassword.value)
      await reauthenticateWithCredential(user.value, credential)
      return true
    } catch (error) {
      console.error("ошибка при повторной аутентификации:", error)
      const userMessage = getErrorMessage(error)
      showMessage('ошибка: ' + userMessage, 'error')
      return false
    }
  }
  async function saveProfile() {
    if (!user.value || !user.value.uid) {
      showMessage('пользователь не авторизован.', 'error')
      return
    }
    const userId = user.value.uid
    const updates = {}
    const nicknameRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;
    if (editedNickname.value.trim() !== getUserNickname(userId)) {
      if (!nicknameRegex.test(editedNickname.value.trim())) {
        showMessage('никнейм может содержать только буквы !', 'error')
        return
      }
      updates[`users/${userId}/nickname`] = editedNickname.value.trim()
    }
    if (editedAvatar.value.trim() !== getUserAvatar(userId)) {
      updates[`users/${userId}/avatar`] = editedAvatar.value.trim()
    }
    try {
      if (Object.keys(updates).length > 0) {
        await update(dbRef(db), updates)
        showMessage('профиль обновлен !', 'success')
        if (updates[`users/${userId}/avatar`]) {
          await updateMessagesAvatar(userId, updates[`users/${userId}/avatar`])
        }
      }
      if (newPassword.value.trim()) {
        if (newPassword.value.length < 6) {
          showMessage('пароль должен содержать не менее 6 символов !', 'error')
          return
        }
        const reauthSuccess = await reauthenticateUser()
        if (!reauthSuccess) {
          return
        }
        try {
          await updatePassword(user.value, newPassword.value)
          showMessage('пароль обновлен !', 'success')
          newPassword.value = ''
          currentPassword.value = ''
        } catch (error) {
          console.error("ошибка при смене пароля:", error)
          const userMessage = getErrorMessage(error)
          showMessage('ошибка при смене пароля: ' + userMessage, 'error')
        }
      }
      closeAvatarModal()
    } catch (error) {
      console.error("ошибка при обновлении профиля:", error)
      const userMessage = getErrorMessage(error)
      showMessage('ошибка при обновлении профиля: ' + userMessage, 'error')
    }
  }
  async function changePassword() {
    if (!user.value) {
      showMessage('не авторизован !', 'error')
      return
    }
    if (!newPassword.value.trim()) {
      showMessage('введи новый пароль !', 'error')
      return
    }
    if (newPassword.value.length < 6) {
      showMessage('пароль должен содержать не менее 6 символов !', 'error')
      return
    }
    if (!currentPassword.value) {
      showMessage('введи текущий пароль для подтверждения.', 'error')
      return
    }
    try {
      const credential = EmailAuthProvider.credential(user.value.email, currentPassword.value)
      await reauthenticateWithCredential(user.value, credential)
      await updatePassword(user.value, newPassword.value)
      showMessage('пароль успешно изменен !', 'success')
      newPassword.value = ''
      currentPassword.value = ''
      closeAvatarModal()
    } catch (error) {
      console.error("ошибка при смене пароля:", error)
      const userMessage = getErrorMessage(error)
      showMessage('ошибка при смене пароля: ' + userMessage, 'error')
    }
  }
  async function updateMessagesAvatar(uid, newAvatarUrl) {
    try {
      const userMessagesQuery = query(messagesRef, orderByChild('uid'), equalTo(uid))
      const messagesSnapshot = await get(userMessagesQuery)
      const messagesData = messagesSnapshot.val()
      if (messagesData) {
        const updates = {}
        Object.keys(messagesData).forEach(messageId => {
          updates[`${messageId}/avatar`] = newAvatarUrl
        })
        await update(messagesRef, updates)
        showMessage('аватарка обновлена !', 'success')
      }
    } catch (error) {
      console.error("ошибка при обновлении аватарок сообщений:", error)
      showMessage('ошибка при обновлении аватарок сообщений !', 'error')
    }
  }
  async function deleteProfile() {
    if (!user.value || !user.value.uid) {
      showMessage('Пользователь не авторизован.', 'error')
      return
    }
    if (deleteConfirmationText.value.trim().toLowerCase() !== 'sudo delete') {
      showMessage('для удаления профиля введи слово "sudo delete"!', 'error')
      return
    }
    const userId = user.value.uid
    const userSnapshot = await get(child(dbRef(db), `users/${userId}`))
    if (!userSnapshot.exists()) {
      showMessage('не удалось найти данные пользователя для удаления.', 'error')
      return
    }
    const userData = userSnapshot.val()
    const nicknameToDelete = userData.nickname
    const updates = {}
    updates[`users/${userId}`] = null
    if (nicknameToDelete) {
      updates[`nicknames/${nicknameToDelete}`] = null
    }
    try {
      await update(dbRef(db), updates)
      showMessage('Данные пользователя в базе удалены!', 'success')
    } catch (error) {
      console.error("ошибка при удалении данных пользователя из БД:", error)
      showMessage('ошибка при удалении данных из БД: ' + error.message, 'error')
      return
    }

    try {
      const userMessagesQuery = query(messagesRef, orderByChild('uid'), equalTo(userId))
      const messagesSnapshot = await get(userMessagesQuery)
      const messagesData = messagesSnapshot.val()
      if (messagesData) {
        const msgUpdates = {}
        Object.keys(messagesData).forEach(msgId => {
          msgUpdates[msgId] = null
        })
        await update(messagesRef, msgUpdates)
        showMessage('все сообщения пользователя удалены !', 'success')
      }
    } catch (error) {
      console.error("ошибка при удалении сообщений пользователя:", error)
      showMessage('ошибка при удалении сообщений пользователя: ' + error.message, 'error')
    }
    try {
      await deleteUser(user.value)
      showMessage('профиль успешно удален !', 'success')
      await signOut(auth)
      router.push('/log')
    } catch (error) {
      console.error("ошибка при удалении пользователя из Firebase Auth:", error)
      showMessage('ошибка при удалении пользователя: ' + error.message, 'error')
    }
  }

  function showSingleMessage(messageId) {
    window.location.hash = messageId;
  }

  function checkHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      singleMessageId.value = hash;
      if (!findMessageById(hash)) {
        singleMessageId.value = null;
      }
    } else {
      singleMessageId.value = null;
    }
  }
  window.addEventListener('hashchange', () => {
    checkHash();
  });
  onMounted(async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission()
      }
    }
    onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/log')
      } else {
        user.value = currentUser
        await checkAdmin()
        selectedMessages.value = []
        await loadUsers()
        await loadInitialMessages()
        // Проверяем хэш при загрузке страницы
        checkHash();
        if (latestTimestamp !== null) {
          const newMessagesQuery = query(messagesRef, orderByChild('timestamp'), startAt(latestTimestamp + 1))
          onChildAdded(newMessagesQuery, (snap) => {
            const msg = {
              id: snap.key,
              ...snap.val()
            }
            if (!findMessageById(msg.id)) {
              messages.value.unshift(msg)
              if (msg.timestamp > latestTimestamp) {
                latestTimestamp = msg.timestamp
              }
              if (msg.replyTo) {
                ensureReplyMessage(msg.replyTo)
              }
              if (document.hidden) {
                showNotification(msg)
              }
            }
          })
        }
        onChildChanged(messagesRef, (snap) => {
          const msg = {
            id: snap.key,
            ...snap.val()
          }
          const index = messages.value.findIndex(m => m.id === msg.id)
          if (index !== -1) {
            messages.value[index] = msg
            messages.value.sort((a, b) => b.timestamp - a.timestamp)
          }
          if (replyMessages.value[msg.id]) {
            replyMessages.value[msg.id] = {
              ...msg
            }
          }
          messages.value.forEach(m => {
            if (m.replyTo === msg.id) {
              replyMessages.value[m.replyTo] = {
                ...msg
              }
            }
          })
        })
        onChildRemoved(messagesRef, (snap) => {
          const id = snap.key
          const index = messages.value.findIndex(m => m.id === id)
          if (index !== -1) {
            messages.value.splice(index, 1)
          }
          if (replyMessages.value[id]) {
            delete replyMessages.value[id]
          }
        })
      }
    })
  })
</script>
