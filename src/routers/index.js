import { createRouter, createWebHistory } from 'vue-router'
import Word from '../views/word.vue'
import Sentence from '../views/sentence.vue'

const routes = [
  {
    path: '/',
    redirect: '/word'
  },
  {
    path: '/word',
    name: 'Word',
    component: Word
  },
  {
    path: '/sentence',
    name: 'Sentence',
    component: Sentence
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
