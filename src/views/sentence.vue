<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getRandomEnglishWords } from '../api/api.js'
import { Icon } from '@iconify/vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'

// 当前单词数据
const wordData = ref(null)
// 当前句子索引
const currentSentenceIndex = ref(0)
// 当前句子
const currentSentence = ref('')
// 当前索引（用户已输入到第几个字符）
const currentIndex = ref(0)
// 切割后的字符数组
const characters = ref([])
// 加载状态
const loading = ref(false)
// 错误信息
const error = ref('')
// 音频对象
const audio = ref(null)
// Enter 键按下时间记录
const lastEnterPress = ref(0)

// 获取当前句子对象
const currentSentenceData = computed(() => {
  if (!wordData.value?.sentences || wordData.value.sentences.length === 0) {
    return null
  }
  return wordData.value.sentences[currentSentenceIndex.value]
})

// 播放发音
const playAudio = () => {
  if (audio.value) {
    audio.value.currentTime = 0
    audio.value.play().catch(err => {
      console.error('播放音频失败:', err)
    })
  }
}

// 初始化字符数组
const initCharacters = () => {
  if (!currentSentence.value) return
  
  // 将弯引号和破折号替换为键盘可输入的字符
  const normalizedSentence = currentSentence.value
    .replace(/[\u2018\u2019]/g, "'")     // ‘ ’ → '
    .replace(/[\u201C\u201D]/g, '"')     // “ ” → "
    .replace(/[\u2013\u2014\u2011]/g, '-') // – — - → -

  characters.value = normalizedSentence.split('').map((char, index) => ({
    char,
    index,
    isHighlighted: false,
    isActive: index === 0,
    isError: false
  }))
}


// 获取随机单词（包含句子）
const fetchWord = async () => {
  loading.value = true
  error.value = ''
  
  try {
    const data = await getRandomEnglishWords()
    
    if (data && data.data) {
      wordData.value = data.data
      
      // 检查是否有句子数据
      if (!data.data.sentences || data.data.sentences.length === 0) {
        error.value = '该单词没有例句，正在获取新单词...'
        setTimeout(() => {
          fetchWord()
        }, 1000)
        return
      }
      
      currentSentenceIndex.value = 0
      currentSentence.value = data.data.sentences[0].s_content
      currentIndex.value = 0
      
      // 停止之前的音频
      if (audio.value) {
        audio.value.pause()
      }

      // 初始化音频
      if (data.data.usspeech) {
        audio.value = new Audio(data.data.usspeech)
      }
      
      initCharacters()
    } else {
      error.value = '获取数据失败，数据格式错误'
    }
  } catch (err) {
    error.value = '获取数据失败，请重试'
    console.error('获取数据错误:', err)
  } finally {
    loading.value = false
  }
}

// 切换到下一个句子
const nextSentence = () => {
  if (!wordData.value?.sentences) return
  
  if (currentSentenceIndex.value < wordData.value.sentences.length - 1) {
    // 还有下一个句子
    currentSentenceIndex.value++
    currentSentence.value = wordData.value.sentences[currentSentenceIndex.value].s_content
    currentIndex.value = 0
    initCharacters()
    ElMessage.success('下一个句子！')
  } else {
    // 所有句子完成，获取新单词
    ElMessage.success('完成所有句子，开始新单词！')
    reset()
  }
}

// 处理 Enter 键逻辑
const handleEnterKey = () => {
  // 已完成所有字符，切换下一个句子
  if (currentIndex.value >= characters.value.length) {
    nextSentence()
    return
  }
  
  // 未完成，检测双击 Enter
  const now = Date.now()
  if (now - lastEnterPress.value <= 1000) {
    // 1秒内第二次按下 Enter
    ElMessage.warning('跳过当前句子')
    nextSentence()
  } else {
    // 第一次按下 Enter
    ElMessage.info('再按一次 Enter 跳过当前句子')
  }
  lastEnterPress.value = now
}

// 处理字符输入
const handleInput = (key) => {
  // 获取当前应该输入的字符
  const currentChar = characters.value[currentIndex.value]
  
  // 判断按键是否正确（区分大小写，保留标点和空格）
  if (key === currentChar.char) {
    // 正确：高亮当前字符
    currentChar.isHighlighted = true
    currentChar.isActive = false
    currentChar.isError = false
    
    // 移动到下一个字符
    currentIndex.value++
    
    // 激活下一个字符（如果存在）
    if (currentIndex.value < characters.value.length) {
      characters.value[currentIndex.value].isActive = true
    } else {
      // 完成当前句子
      ElMessage.success('完成！按 Enter 继续')
    }
  } else {
    // 错误：显示错误状态（忽略功能键等，只对单字符输入反馈错误）
    if (key.length === 1) {
      currentChar.isError = true
      setTimeout(() => {
        if (currentChar) currentChar.isError = false
      }, 500)
    }
  }
}

// 键盘按下事件处理
const handleKeyDown = (event) => {
  const key = event.key
  
  // 阻止空格键的默认翻页行为
  if (key === ' ') {
    event.preventDefault()
  }
  
  // 处理 Enter 键
  if (key === 'Enter') {
    handleEnterKey()
    return
  }
  
  // 如果已经完成所有字符，不再处理其他按键
  if (currentIndex.value >= characters.value.length) {
    return
  }
  
  handleInput(key)
}

// 重置游戏（获取新单词）
const reset = () => {
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
  <div class="sentence-container">
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
    <template v-else-if="wordData && currentSentenceData">
      <!-- 单词信息 -->
      <div class="word-info">
        <div class="word-title">
          <span class="word">{{ wordData.word }}</span>
          <Icon icon="weui:voice-outlined" @click="playAudio" :width="24" :height="24" class="audio-icon" />
        </div>
        
        <!-- 音标 -->
        <div class="phonetic" v-if="wordData.ukphone || wordData.usphone">
          <span v-if="wordData.ukphone" class="uk-phone">
            英 [{{ wordData.ukphone }}]
          </span>
          <span v-if="wordData.usphone" class="us-phone">
            美 [{{ wordData.usphone }}]
          </span>
        </div>
      </div>
      
      <!-- 句子显示区 -->
      <div class="sentence-display">
        <span
          v-for="character in characters"
          :key="character.index"
          :class="{
            'character': true,
            'highlighted': character.isHighlighted,
            'active': character.isActive,
            'space': character.char === ' ',
            'error': character.isError
          }"
        >
          {{ character.char === ' ' ? '\u00A0' : character.char }}
        </span>
      </div>
      
      <!-- 中文翻译 -->
      <div class="translation">
        {{ currentSentenceData.s_cn }}
      </div>
      
      <!-- 进度信息 -->
      <div class="info">
        <p>进度: {{ currentIndex }} / {{ characters.length }}</p>
        <p>句子: {{ currentSentenceIndex + 1 }} / {{ wordData.sentences.length }}</p>
        <button @click="nextSentence" class="reset-btn">
          {{ currentSentenceIndex < wordData.sentences.length - 1 ? '下一个句子' : '下一个单词' }}
        </button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sentence-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  gap: 30px;
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

.word-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.word-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.word {
  font-size: 32px;
  font-weight: bold;
  color: #646cff;
}

.audio-icon {
  cursor: pointer;
  color: #646cff;
  transition: transform 0.2s;
}

.audio-icon:hover {
  transform: scale(1.2);
}

.phonetic {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 16px;
  color: #888;
}

.sentence-display {
  font-size: 28px;
  font-weight: 500;
  line-height: 1.6;
  margin: 20px 0;
  user-select: none;
  text-align: center;
  max-width: 90%;
}

.character {
  display: inline-block;
  transition: all 0.3s ease;
  color: #666;
}

.character.space {
  width: 0.3em;
}

.character.active {
  color: #646cff;
  text-decoration: underline;
  text-underline-offset: 6px;
  animation: pulse 1s infinite;
}

.character.highlighted {
  color: #42b883;
  transform: scale(1.05);
  text-shadow: 0 0 8px rgba(66, 184, 131, 0.5);
}

.character.error {
  color: #f56c6c;
  animation: shake 0.5s;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.translation {
  font-size: 20px;
  color: #888;
  text-align: center;
  font-style: italic;
}

.info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.info p {
  font-size: 18px;
  color: #888;
  margin: 0;
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
