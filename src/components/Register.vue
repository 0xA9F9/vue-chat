<template>
  <div class="form">
    <form @submit.prevent="submitReg" class="lorefo">
      <!-- Загрузка аватара -->
      <label
        class="dropzone"
        :class="{ 'dropzone--active': isDragOver }"
        @dragover.prevent="handleDragOver"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <template v-if="!avatarURL">
          <img src="https://placehold.co/100?text=AVATAR" style="width:100%; height:100%; border-radius:50%;">
        </template>
        <template v-else>
          <img :src="avatarURL" alt="avatar" class="uploaded-avatar"/>
        </template>

        <input
          type="file"
          accept="image/*"
          hidden
          @change="handleFileSelect"
          ref="fileInputRef"
        />
      </label>

      <!-- Поля ввода -->
      <input
        id="reg-nickname"
        type="text"
        v-model="regNickname"
        placeholder="Ник"
        required
      >
      <input
        id="reg-email"
        type="email"
        v-model="regEmail"
        placeholder="Email"
        required
      >
      <input
        id="reg-password"
        type="password"
        v-model="regPassword"
        placeholder="Пароль"
        required
      >
      <input
        id="reg-confirm-password"
        type="password"
        v-model="regConfirmPassword"
        placeholder="Подтверди пароль"
        required
      >

      <!-- Кнопка регистрации -->
      <button type="submit" :disabled="loading">
        {{ loading ? 'Загрузка...' : 'Зарегистрироваться' }}
      </button>
    </form>
    <br>
    <router-link to="/log">Уже есть аккаунт? Войти</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase.js';
import { ref as dbRef, get, set } from 'firebase/database';

const router = useRouter();
const regNickname = ref('');
const regEmail = ref('');
const regPassword = ref('');
const regConfirmPassword = ref('');
const isDragOver = ref(false);
const avatarURL = ref(null);
const loading = ref(false);
const fileInputRef = ref(null);

const showMessage = window.showMessage || function(message, type = 'info') {
  console.log(`[${type.toUpperCase()}]: ${message}`)
}

async function checkNicknameAvailability(nickname) {
  try {
    const snapshot = await get(dbRef(db, `nicknames/${nickname}`));
    return !snapshot.exists();
  } catch (error) {
    console.error('Ошибка при проверке никнейма:', error.message);
    return false;
  }
}

async function submitReg() {
  const nicknameRegex = /^[a-zA-Zа-яА-ЯёЁ]+$/;

  if (regPassword.value !== regConfirmPassword.value) {
    showMessage('пароли не совпадают !', 'error');
    return;
  }
  if (!nicknameRegex.test(regNickname.value.trim())) {
    showMessage('никнейм может содержать только буквы !', 'error');
    return;
  }
  if (!avatarURL.value) {
    showMessage('выбери аватарку !', 'error');
    return;
  }

  const isNicknameAvailable = await checkNicknameAvailability(regNickname.value.trim());
  if (!isNicknameAvailable) {
    showMessage('этот ник уже занят !', 'error');
    return;
  }

  try {
    loading.value = true;
    const userCredential = await createUserWithEmailAndPassword(auth, regEmail.value, regPassword.value);
    await updateProfile(userCredential.user, {
      displayName: regNickname.value,
      photoURL: avatarURL.value
    });

    // Определяем userRef
    const userRef = dbRef(db, `users/${userCredential.user.uid}`);
    await set(userRef, {
      nickname: regNickname.value,
      avatar: avatarURL.value
    });

    // Записываем nickname в 'nicknames' node
    const nicknameRef = dbRef(db, `nicknames/${regNickname.value.trim()}`);
    await set(nicknameRef, userCredential.user.uid);

    showMessage('регистрация завершена !', 'success');
    router.push('/');
  } catch (error) {
    if (error.code === 'auth/weak-password') {
      showMessage('пароль должен быть минимум 6 символов !', 'error');
    } else if (error.code === 'auth/email-already-in-use') {
      showMessage('этот email уже зарегистрирован!', 'error');
    } else {
      console.error('Ошибка при регистрации:', error);
      showMessage('ошибка при регистрации: ' + error.message, 'error');
    }
  } finally {
    loading.value = false;
  }
}

async function uploadImageToImgbb(file) {
  const apiKey = import.meta.env.VITE_IMGBB_API_KEY;
  if (!apiKey) {
    showMessage('отсутствует API ключ!', 'error');
    return;
  }

  try {
    loading.value = true;
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    if (data?.data?.url) {
      avatarURL.value = data.data.url;
      showMessage('загружена !', 'success');
    } else {
      console.error('Ответ imgbb:', data);
    }
  } finally {
    loading.value = false;
  }
}

function handleDragOver() {
  isDragOver.value = true;
}

function handleDragLeave() {
  isDragOver.value = false;
}

async function handleDrop(e) {
  const file = e.dataTransfer.files[0];
  if (file) await uploadImageToImgbb(file);
}

async function handleFileSelect(e) {
  const file = e.target.files[0];
  if (file) await uploadImageToImgbb(file);
}
</script>

