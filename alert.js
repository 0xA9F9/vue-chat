import { reactive } from 'vue';

const alertState = reactive({
  message: '',
  type: '', 
});

export function showMessage(message, type = 'success') {
  alertState.message = message;
  alertState.type = type === 'success' ? 'alert-success' : 'alert-error';
  setTimeout(() => {
    alertState.message = '';
    alertState.type = '';
  }, 5000);
}

export default alertState;
