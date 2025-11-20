<script setup>
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const navigateTo = (path) => {
  router.push(path)
}
</script>

<template>
  <div class="app-container">
    <div class="button-group" v-show="route.path !== '/word' && route.path !== '/sentence'">
      <button 
        @click="navigateTo('/word')" 
        :class="{ active: route.path === '/word' }"
      >
        Word
      </button>
      <button 
        @click="navigateTo('/sentence')" 
        :class="{ active: route.path === '/sentence' }"
      >
        Sentence
      </button>
    </div>
    
    <div class="view-container">
      <router-view />
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.button-group {
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  z-index: 1000;
}

.button-group button {
  font-size: 16px;
  border: 2px solid #646cff;
  background-color: transparent;
  color: #646cff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.button-group button:hover {
  background-color: #646cff;
  color: white;
}

.button-group button.active {
  background-color: #646cff;
  color: white;
}

.view-container {
  width: 100%;
  height: 100%;
}
</style>
