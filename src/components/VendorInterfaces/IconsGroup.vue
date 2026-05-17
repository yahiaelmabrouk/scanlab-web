<!-- eslint-disable vue-i18n/no-raw-text -->
<template>
  <div>
    <v-container>
      <v-row>
        <v-col class="main">
          <div class="icons">
            <img src="@/assets/siemens_img/bin.png" class="img-size" />
            <span>Delete</span>
          </div>
          <div class="icons">
            <img src="@/assets/siemens_img/skip.png" class="img-size" />
            <span>Skip</span>
          </div>
          <div class="icons">
            <img src="@/assets/siemens_img/stop.png" class="img-size" />
            <span>Stop</span>
          </div>
          <div class="icons">
            <img src="@/assets/siemens_img/pause.png" class="img-size" />
            <span>Pause</span>
          </div>
          <div class="icons">
            <img src="@/assets/siemens_img/continue.png" class="img-size" />
            <span>Continue</span>
          </div>
          <div class="icons">
            <img src="@/assets/siemens_img/go.png" class="img-size" />

            <span> Copy&Go</span>
          </div>
          <div>
            <ScanButton :freebie="stackQuestion && stackQuestion.freebie" />
          </div>

          <!-- <div class="mx-1">
            <v-btn color="#4f545c" size="x-small" rounded>Cancel</v-btn>
          </div> -->
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
import { ScanButtonMixin } from '../Mixins/ScanButtonMixin'
import { mapGetters, mapActions, mapState } from 'vuex'
import ScanButton from '../ScanButton.vue'

export default {
  mixins: [ScanButtonMixin],
  components: { ScanButton },
  computed: {
    ...mapGetters('questionService', ['stackQuestion']),
    ...mapState('questionService', ['isViewingCriticalThinkingQuestion']),
  },
  methods: {
    ...mapActions('questionService', ['proceedToTakingPostQuestions']),
  },
}
</script>

<style scoped>
.v-btn {
  border-radius: 5rem;
  margin: 0.2rem;
  color: white !important;
}

.img-size {
  height: 1rem;
}

.v-btn:not(.v-btn--round).v-size--default {
  height: 22px;
  min-width: 50%;
  padding: 0 12px;
  font-size: 0.5rem !important;
}

.icons {
  color: white !important;
  font-size: 0.7rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0.5%;
  margin-top: 0rem;
}

.main {
  display: flex;
  justify-content: space-evenly;
  margin-right: 0.5rem;
  margin-left: 0.5rem;
  align-items: center;
  padding-top: 5px;
}

span {
  font-size: 0.6rem;
}

/* Responsive Styles */
@media (max-width: 1200px) {
  .v-btn:not(.v-btn--round).v-size--default {
    height: 24px;
    min-width: 60%;
    padding: 0 14px;
    font-size: 0.6rem !important;
  }

  .icons {
    font-size: 0.8rem;
    margin: 1%;
  }

  .main {
    margin-right: 1rem;
    margin-left: 1rem;
  }

  span {
    font-size: 0.7rem;
  }
}

@media (max-width: 768px) {
  .v-btn:not(.v-btn--round).v-size--default {
    height: 26px;
    min-width: 70%;
    padding: 0 16px;
    font-size: 0.7rem !important;
  }

  .icons {
    font-size: 0.9rem;
    margin: 1.5%;
  }

  .main {
    flex-direction: column;
    margin-right: 1rem;
    margin-left: 1rem;
  }

  span {
    font-size: 0.8rem;
  }
}

@media (max-width: 576px) {
  .v-btn:not(.v-btn--round).v-size--default {
    height: 28px;
    min-width: 80%;
    padding: 0 18px;
    font-size: 0.8rem !important;
  }

  .icons {
    font-size: 1rem;
    margin: 2%;
  }

  .main {
    flex-direction: column;
    margin-right: 1rem;
    margin-left: 1rem;
  }

  span {
    font-size: 0.9rem;
  }
}
</style>
