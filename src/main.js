import { createApp } from 'vue';
import App from './App.vue';
import router from './router.js';
import './styles.css'; 
import { showMessage } from './alert.js';

window.showMessage = showMessage;

const app = createApp(App);
app.use(router);

router.afterEach((to) => {
  if (to.meta && to.meta.title) {
    document.title = to.meta.title;
  } else {
    document.title = 'Чат';
  }
});

app.mount('#chat');
