<template>
  <div class="form">
    <form @submit.prevent="submitLogin" class="lorefo">
      <input 
          id="login-email" 
          type="email" 
          v-model="loginEmail" 
          placeholder="Email"  
          required
      >
      <input 
          id="login-password" 
          type="password" 
          v-model="loginPassword" 
          placeholder="Пароль"  
          required
      >
      <button type="submit">Войти</button>
    </form>
    <br>
    <div>
      <router-link to="/reg">Регистрация</router-link> ~
      <router-link to="/forgot">Забыли пароль?</router-link>
    </div>
  </div>
</template>


<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase.js'

const router = useRouter()
const loginEmail = ref('')
const loginPassword = ref('')

async function submitLogin() {
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginPassword.value);
    showMessage('ты в системе !', 'success');
    router.push('/');
  } catch (error) {
    console.error(error);
    showMessage('неправильный пароль или пользователя не существует !', 'error');
  }
}

</script>
