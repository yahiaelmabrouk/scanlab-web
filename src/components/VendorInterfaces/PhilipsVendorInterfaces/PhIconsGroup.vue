<template>
  <div>
    <v-card>
      <v-container>
        <v-row>
          <v-col class="main">
            <div>
              <ScanButton :freebie="stackQuestion && stackQuestion.freebie" />
            </div>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </div>
</template>

<script>
import { ScanButtonMixin } from '../../Mixins/ScanButtonMixin'
import { MriMixin } from '../../Mixins/MriMixin'
import { SelectionConfigMixin } from '../../Mixins/SelectionConfigMixin'
import { mapGetters, mapActions, mapState } from 'vuex'
import ScanButton from '../../ScanButton.vue'

export default {
  mixins: [ScanButtonMixin, MriMixin, SelectionConfigMixin],
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
}
span {
  font-size: 0.6rem;
}
</style>
