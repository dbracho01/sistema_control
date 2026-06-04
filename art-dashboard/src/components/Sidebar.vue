<template>
  <div class="sidebar">
    <h2>Dashboard</h2>
    <div class="stats-card">
      <h3>Equipments in warranty</h3>
      <div class="stat-number">{{ stats.vigente }}</div>
    </div>
    <div class="stats-card warning">
      <h3>Expiring soon</h3>
      <div class="stat-number">{{ stats.proximo }}</div>
    </div>
    <div class="stats-card danger">
      <h3>Expired warranties</h3>
      <div class="stat-number">{{ stats.vencido }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ stats: { type: Object, required: true } })
</script>

<style scoped>
.sidebar {
  width: 260px;
  background: white;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.02);
  height: fit-content;
}

.sidebar h2 {
  color: #1e293b;
  margin-bottom: 20px;
  font-size: 1.1em;
  font-weight: 600;
  text-transform: uppercase;
  border-bottom: 2px solid #f8fafc;
  padding-bottom: 12px;
}

.stats-card {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 12px;
  color: white;
  transition: transform 0.2s;
}

.stats-card:hover { transform: translateY(-2px); }
.stats-card.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
.stats-card.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
.stats-card h3 { font-size: 0.85em; font-weight: 400; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; }
.stat-number { font-size: 2em; font-weight: 700; line-height: 1; }
</style>