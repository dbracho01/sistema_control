<template>
  <div class="logo-header">
    <img src="/assets/logo.png" alt="ART Logo" class="logo-header-img">
  </div>
</template>

<style scoped>
.logo-header {
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 1000;
  background: white;
  padding: 8px 16px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.logo-header-img {
  height: 35px;
  width: auto;
  display: block;
}
</style>