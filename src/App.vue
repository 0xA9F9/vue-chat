<template>
    <div id="alert-container">
      <div v-if="alertState.message" :class="['alert', alertState.type]">
        {{ alertState.message }}
      </div>
    </div>
    <router-view />
</template>

<script>
import alertState from './alert.js';

export default {
  setup() {
    return {
      alertState,
    };
  },
};
</script>