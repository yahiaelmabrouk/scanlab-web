<!-- eslint-disable prettier/prettier -->
<!-- eslint-disable vue/no-parsing-error -->
<template>
  <div class="side-1">
    <div class="sidebar">
      <PatientView />
      <IconsGroup style="height: 6.5%" />
      <div class="divide" data-v-7f749bf4></div>
      <FooterOptions style="height: 42%; display: flex; flex-direction: column; justify-content: end" />
    </div>
  </div>
</template>

<script>
import PatientView from './PatientView'
import IconsGroup from './IconsGroup'
import FooterOptions from './FooterOptions'

export default {
  components: {
    PatientView,
    IconsGroup,
    FooterOptions,
  },
}
</script>

<style scoped>
.sidebar {
  height: 100%;
  overflow-y: hidden !important;
  background-color: black;
}

.side-1 {
  height: 100%;
}

.divide {
  display: flex;
  flex-direction: column;
  align-self: flex-start;
  width: 100%;
  height: 1px;
  background-color: white;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .sidebar {
    overflow-y: auto; /* Allow scrolling if content overflows */
  }

  .divide {
    margin-top: 2%; /* Adjust margin for medium screens */
  }
}

@media (max-width: 768px) {
  .sidebar {
    overflow-y: auto; /* Allow scrolling if content overflows */
  }

  .divide {
    height: 1px; /* Thinner dividing line for small screens */
    margin-top: 1.5%; /* Adjust margin for smaller screens */
  }
}

@media (max-width: 480px) {
  .sidebar {
    overflow-y: auto; /* Allow scrolling if content overflows */
    padding: 0; /* Remove padding for very small screens */
  }

  .divide {
    height: 1px; /* Maintain consistency */
    margin-top: 1%; /* Adjust margin for very small screens */
  }
}
</style>
