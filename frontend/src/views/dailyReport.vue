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
  background:
    radial-gradient(circle at 12% 4%, rgba(243, 178, 61, 0.14), transparent 26%),
    linear-gradient(180deg, var(--learn-surface-soft, #f6f2e8) 0%, #fffaf0 100%);
}
</style>
