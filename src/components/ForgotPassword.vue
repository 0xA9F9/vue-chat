<template>
  <div class="form">
    <form @submit.prevent="resetPassword" class="lorefo">
      <input 
          id="forgot-email" 
          type="email" 
          v-model="forgotEmail" 
          placeholder="Email"  
          required
      >
      <button type="submit">Восстановить пароль</button>
    </form>
    <br>
    <router-link to="/log">Вернуться к входу</router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { sendPasswordResetEmail } from 'firebase/auth'
import { auth } from '../firebase.js'

const router = useRouter()
const forgotEmail = ref('')

async function resetPassword() {
  try {
    await sendPasswordResetEmail(auth, forgotEmail.value);
    showMessage('ссылка на восстановление отправлено !', 'success');
    router.push('/log');
  } catch (error) {
    console.error(error);
    showMessage('ошибка при восстановлении пароля: ' + error.message, 'error');
  }
}

</script>

