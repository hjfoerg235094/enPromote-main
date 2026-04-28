<template>
  <main class="flashcard-review-page">
    <section class="review-shell">
      <div class="review-page-heading">
        <div>
          <span class="learn-kicker">单词复习</span>
          <h1>把今天该巩固的词，一张一张收回来。</h1>
        </div>
        <button class="learn-button secondary" type="button" @click="goDailyStudy">
          返回今日任务
        </button>
      </div>

      <FlashCardReview />
    </section>
  </main>
</template>

<script setup>
import { useRouter } from 'vue-router'
import FlashCardReview from '@/components/FlashCardReview.vue'

const router = useRouter()

function goDailyStudy() {
  router.push('/daily-study')
}
</script>

<style scoped>
.flashcard-review-page {
  min-height: calc(100vh - 68px);
  padding: 28px max(18px, 5vw) 64px;
  background:
    radial-gradient(circle at top left, rgba(240, 164, 58, 0.16), transparent 30rem),
    linear-gradient(180deg, #fbf8ef 0%, var(--learn-bg) 100%);
}

.review-shell {
  width: min(1180px, 100%);
  margin: 0 auto;
}

.review-page-heading {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 18px;
  margin-bottom: 18px;
}

.review-page-heading h1 {
  max-width: 760px;
  margin: 14px 0 0;
  font-size: clamp(32px, 5vw, 56px);
  line-height: 1.08;
  letter-spacing: 0;
}

@media (max-width: 720px) {
  .flashcard-review-page {
    padding: 18px 10px 42px;
  }

  .review-page-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
