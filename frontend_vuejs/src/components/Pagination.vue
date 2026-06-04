<template>
  <div class="pagination-container">
    <div class="pagination-info">Showing {{ startItem }}-{{ endItem }} of {{ totalItems }} items</div>
    <div class="pagination-controls">
      <button class="pagination-btn" :disabled="currentPage === 1" @click="$emit('page-changed', currentPage - 1)">◀ Previous</button>
      <div class="pagination-numbers">
        <button v-for="page in visiblePages" :key="page"
          :class="['pagination-number', { active: page === currentPage }]"
          @click="$emit('page-changed', page)">
          {{ page }}
        </button>
      </div>
      <button class="pagination-btn" :disabled="currentPage === totalPages" @click="$emit('page-changed', currentPage + 1)">Next ▶</button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ currentPage: Number, totalPages: Number, totalItems: Number })
defineEmits(['page-changed'])

const startItem = computed(() => (props.currentPage - 1) * 5 + 1)
const endItem = computed(() => Math.min(props.currentPage * 5, props.totalItems))

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - Math.floor(maxVisible / 2))
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})
</script>

<style scoped>
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 15px 0;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
  gap: 15px;
}
.pagination-info { color: #64748b; font-size: 13px; font-weight: 500; }
.pagination-controls { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.pagination-btn {
  background: white;
  border: 1px solid #e2e8f0;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.pagination-btn:hover:not(:disabled) { background: #2563eb; color: white; border-color: #2563eb; }
.pagination-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.pagination-numbers { display: flex; gap: 5px; }
.pagination-number {
  min-width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
}
.pagination-number.active { background: #2563eb; color: white; border-color: #2563eb; }
</style>