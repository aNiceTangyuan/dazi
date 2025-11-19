<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { getRandomEnglishWords } from '../api/api.js'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// 当前单词数据
const wordData = ref(null)
// 当前单词
const word = ref('')
// 当前索引（用户已输入到第几个字母）
const currentIndex = ref(0)
// 切割后的字母数组
const letters = ref([])
// 加载状态
const loading = ref(false)
// 错误信息
const error = ref('')
// 音频对象
const audio = ref(null)
// Enter 键按下时间记录
const lastEnterPress = ref(0)
const enterPressCount = ref(0)

// 播放发音
const playAudio = () => {
  if (audio.value) {
    audio.value.play().catch(err => {
      console.error('播放音频失败:', err)
    })
  }
}

// 初始化字母数组
const initLetters = () => {
  if (!word.value) return
  
  letters.value = word.value.split('').map((char, index) => ({
    char,
    index,
    isHighlighted: false,
    isActive: index === 0 // 第一个字母默认激活
  }))
}

// 获取随机单词
const fetchWord = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await getRandomEnglishWords()
    
    if (data && data.data && data.data.word) {
      wordData.value = data.data
      word.value = data.data.word
      currentIndex.value = 0
      
      // 初始化音频
      if (data.data.usspeech) {
        audio.value = new Audio(data.data.usspeech)
        // 获取到数据后播放发音
        playAudio()
      }
      
      initLetters()
    } else {
      error.value = '获取单词失败，数据格式错误'
    }
  } catch (err) {
    error.value = '获取单词失败，请重试'
    console.error('获取单词错误:', err)
  } finally {
    loading.value = false
  }
}

// 键盘按下事件处理
const handleKeyDown = (event) => {
  // 获取按下的键（转为小写）
  const key = event.key.toLowerCase()
  
  // 阻止空格键的默认翻页行为
  if (key === ' ') {
    event.preventDefault()
  }
  
  // 处理 Enter 键
  if (key === 'enter') {
    // 已完成所有字母，直接切换下一个单词
    if (currentIndex.value >= letters.value.length) {
      ElMessage.success('开始下一个单词！')
      reset()
      return
    }
    
    // 未完成，检测双击 Enter
    const now = Date.now()
    if (now - lastEnterPress.value <= 1000) {
      // 1秒内第二次按下 Enter
      ElMessage.warning('跳过当前单词')
      reset()
      enterPressCount.value = 0
    } else {
      // 第一次按下 Enter
      ElMessage.info('再按一次 Enter 跳过当前单词')
      enterPressCount.value = 1
    }
    lastEnterPress.value = now
    return
  }
  
  // 如果已经完成所有字母，不再处理其他按键
  if (currentIndex.value >= letters.value.length) {
    return
  }
  
  // 获取当前应该输入的字母
  const currentLetter = letters.value[currentIndex.value]
  
  // 判断按键是否正确
  if (key === currentLetter.char.toLowerCase()) {
    // 正确：高亮当前字母
    letters.value[currentIndex.value].isHighlighted = true
    letters.value[currentIndex.value].isActive = false
    
    // 移动到下一个字母
    currentIndex.value++
    
    // 激活下一个字母（如果存在）
    if (currentIndex.value < letters.value.length) {
      letters.value[currentIndex.value].isActive = true
    } else {
      // 完成所有字母后播放发音
      playAudio()
      ElMessage.success('完成！按 Enter 继续下一个单词')
    }
  }
}

// 重置游戏（获取新单词）
const reset = () => {
  enterPressCount.value = 0
  lastEnterPress.value = 0
  fetchWord()
}

// 组件挂载时初始化
onMounted(() => {
  fetchWord()
  window.addEventListener('keydown', handleKeyDown)
})

// 组件卸载时移除事件监听
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <div class="home-container">
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <p>加载中...</p>
    </div>
    
    <!-- 错误提示 -->
    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="reset" class="reset-btn">重新获取</button>
    </div>
    
    <!-- 主要内容 -->
    <template v-else-if="wordData">
      <!-- 单词显示区 -->
      <div class="word-display">
        <span
          v-for="letter in letters"
          :key="letter.index"
          :class="{
            'letter': true,
            'highlighted': letter.isHighlighted,
            'active': letter.isActive
          }"
        >
          {{ letter.char }}
        </span>
      </div>
      
      <!-- 单词信息 -->
      <div class="word-info">
        <!-- 音标 -->
        <div class="phonetic" v-if="wordData.ukphone || wordData.usphone">
          <span v-if="wordData.ukphone" class="uk-phone">
            英 [{{ wordData.ukphone }}]
          </span>
          <span v-if="wordData.usphone" class="us-phone">
            美 [{{ wordData.usphone }}]
          </span>
            <Icon icon="weui:voice-outlined" @click="playAudio" :width="24" :height="24" />
        </div>
        
        <!-- 翻译 -->
        <div class="translations" v-if="wordData.translations && wordData.translations.length">
          <span v-for="(trans, index) in wordData.translations" :key="index" class="translation">
            {{ trans.pos }}. {{ trans.tran_cn }}
          </span>
        </div>
      </div>
      
      <!-- 进度信息 -->
      <div class="info">
        <p>进度: {{ currentIndex }} / {{ letters.length }}</p>
        <button @click="reset" class="reset-btn">下一个单词</button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.home-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
}

.loading, .error {
  text-align: center;
}

.loading p {
  font-size: 24px;
  color: #888;
}

.error p {
  font-size: 20px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.word-display {
  font-size: 48px;
  font-weight: bold;
  letter-spacing: 8px;
  margin-bottom: 20px;
  user-select: none;
}

.letter {
  display: inline-block;
  padding: 10px;
  transition: all 0.3s ease;
  color: #666;
}

.letter.active {
  color: #646cff;
  text-decoration: underline;
  text-underline-offset: 8px;
  animation: pulse 1s infinite;
}

.letter.highlighted {
  color: #42b883;
  transform: scale(1.1);
  text-shadow: 0 0 10px rgba(66, 184, 131, 0.5);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.word-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 30px;
  color: #666;
}

.phonetic {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 16px;
}

.uk-phone, .us-phone {
  color: #888;
}



.translations {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
}

.translation {
  font-size: 18px;
  color: #555;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
}

.info p {
  font-size: 20px;
  color: #888;
}

.reset-btn {
  padding: 12px 24px;
  font-size: 16px;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.reset-btn:hover {
  background-color: #535bf2;
}

.reset-btn:active {
  transform: scale(0.98);
}
</style>