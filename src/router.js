import { createRouter, createWebHistory } from 'vue-router'
import Login from './components/Login.vue'
import Register from './components/Register.vue'
import ForgotPassword from './components/ForgotPassword.vue'
import Home from './components/Home.vue'

const routes = [
  { path: '/log', component: Login, meta: { title: 'Вход' } },
  { path: '/reg', component: Register, meta: { title: 'Регистрация' } },
  { path: '/forgot', component: ForgotPassword, meta: { title: 'Восстановление Пароля' } },
  { path: '/', component: Home, meta: { title: 'Чат' } },
  { path: '/:pathMatch(.*)*', redirect: '/' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.onError(() => {
  router.push('/')
})

export default router
