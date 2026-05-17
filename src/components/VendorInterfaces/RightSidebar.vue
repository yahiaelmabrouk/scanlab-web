<template>
  <div class="expand">
    <ExpansionBar />
    <ExpansionBar />
  </div>
</template>

<script>
import ExpansionBar from './ExpansionBar'
export default {
  components: {
    ExpansionBar,
  },
}
</script>

<style scoped>
.expand {
  height: 100%;
  background: black !important;
  border: 1px solid #5a5252;
  border-width: thin;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px; /* Added padding for better spacing */
}

/* Responsive Styles */

/* Mobile Devices (Portrait and Landscape) */
@media (max-width: 767px) {
  .expand {
    padding: 5px; /* Reduced padding on small screens */
  }
}

/* Tablets and Small Desktops */
@media (min-width: 768px) and (max-width: 1024px) {
  .expand {
    padding: 8px; /* Adjusted padding for medium screens */
  }
}

/* Large Desktops and Bigger Screens */
@media (min-width: 1025px) {
  .expand {
    padding: 10px; /* Default padding for large screens */
  }
}
</style>
