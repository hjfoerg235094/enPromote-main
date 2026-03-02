<template>
  <div class="daily-report-page">
    <DailyStudyReport />
    <StudyQualityAssessment />
  </div>
</template>

<script setup lang="ts">
import DailyStudyReport from '../components/DailyStudyReport.vue';
import StudyQualityAssessment from '../components/StudyQualityAssessment.vue';
</script>

<style scoped>
.daily-report-page {
  min-height: 100vh;
  background: #f5f5f5;
}
</style>
