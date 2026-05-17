<template>
  <div class="main-3">
    <v-container class="divide">
      <v-row class="mt-1 pl-6 pr-6 question-area">
        <!-- <QuestionAnswer/> -->
      </v-row>
    </v-container>
  </div>
</template>

<script></script>

<style scoped>
.main-3 {
  background-color: #d5d7d7;
  border: 1px solid #5a5252;
  border-right: 0px;
  border-left: 0px;
  border-bottom: 0px;
  display: flex;

  height: 40%;
  max-height: 41%;
}
.divide {
  display: flex;
  flex-direction: column;
  align-self: self-start;
}
.icons {
  color: white !important;
  font-size: 0.6rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5%;
}

.main {
  display: flex;
}
.main-2 {
  display: flex;
  align-items: flex-end;
  height: 31%;
}

.col {
  flex-grow: 0.5;
}

.v-icon {
  color: #ffffff !important;
  size: 25;
}
</style>
