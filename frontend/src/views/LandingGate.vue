<template>
  <Home v-if="isLoggedIn" />
  <MarketingLanding v-else />
</template>

<script setup>
import { onMounted } from 'vue'
import Home from './home.vue'
import MarketingLanding from './MarketingLanding.vue'
import { getUserInfo, isLoggedIn } from '@/stores/userStore'

onMounted(async () => {
  if (!isLoggedIn.value) {
    await getUserInfo()
  }
})
</script>
