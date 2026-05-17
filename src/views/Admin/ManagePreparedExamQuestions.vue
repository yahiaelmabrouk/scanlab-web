<template>
  <div>
    <v-container>
      <v-card class="mb-4">
        <v-card-title>Question Groups</v-card-title>
        <v-card-text>
          <v-row>
            <v-card-actions>
              <v-btn color="primary" @click="createGroup">Create New Group</v-btn>
            </v-card-actions>
          </v-row>
          <v-row>
            <v-col cols="9">
              <v-select
                label="Question Groups"
                :items="questionGroups"
                v-model="selectedQuestionGroup"
                :disabled="!hasQuestionGroups"
                return-object
                dense
              >
                <template v-slot:item="{ item }">
                  <v-list-item-content>
                    <v-list-item-title class="d-flex align-center">
                      {{ item.text }}
                      <v-chip
                        :color="item.type === 'pre' ? 'primary' : 'secondary'"
                        text-color="white"
                        x-small
                        class="ml-2"
                      >
                        {{ item.type.toUpperCase() }}
                      </v-chip>
                    </v-list-item-title>
                  </v-list-item-content>
                </template>
                <template v-slot:selection="{ item }">
                  <span class="d-flex align-center">
                    {{ item.text }}
                    <v-chip
                      :color="item.type === 'pre' ? 'primary' : 'secondary'"
                      text-color="white"
                      x-small
                      class="ml-2"
                    >
                      {{ item.type.toUpperCase() }}
                    </v-chip>
                  </span>
                </template>
              </v-select>
            </v-col>
            <v-col cols="3">
              <v-list-item-action class="d-flex flex-row justify-end">
                <v-btn icon :disabled="!isGroupSelected" @click="duplicateGroup">
                  <v-icon>mdi-content-copy</v-icon>
                </v-btn>
                <v-btn icon :disabled="!isGroupSelected" @click="deleteGroup">
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-col>
          </v-row>
          <v-row>
            <v-col>
              <v-card-title>
                <v-text-field
                  single-line
                  hide-details
                  label="Search"
                  v-model="search"
                  append-icon="mdi-magnify"
                ></v-text-field>
                <v-spacer></v-spacer>
                <span v-if="isGroupSelected" class="text-subtitle-2">
                  Selected Questions: {{ selectedQuestions.length }}
                </span>
              </v-card-title>
              <v-data-table
                dense
                show-select
                :search="search"
                class="elevation-1"
                :items-per-page="10"
                :headers="questionHeaders"
                v-model="selectedQuestions"
                :items="displayedQuestions"
              >
              </v-data-table>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" :disabled="!isGroupSelected" @click="saveQuestionSelections">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <!-- Dialog for creating/editing groups -->
    <v-dialog v-model="dialogVisible" max-width="500px">
      <v-card>
        <v-card-title>{{ dialogTitle }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="editedGroup.text" label="Group Name"></v-text-field>
          <v-radio-group v-model="editedGroup.type" row :disabled="isDuplicating">
            <v-radio label="Pre" value="pre"></v-radio>
            <v-radio label="Post" value="post"></v-radio>
          </v-radio-group>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="blue darken-1" text @click="closeDialog">Cancel</v-btn>
          <v-btn color="blue darken-1" text @click="saveGroup" :disabled="!editedGroup.text">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { v4 as uuidv4 } from 'uuid'
import { apiGet, apiPost, apiPut, apiDelete } from '@/util/api'
import { mapState, mapActions } from 'vuex'

export default {
  name: 'ManagePreparedExamQuestions',

  data() {
    return {
      // API data collections
      questionGroups: [],
      allQuestions: [],
      // UI state
      search: '',
      dialogVisible: false,
      isDuplicating: false,
      dialogMode: 'create', // 'create', 'edit', or 'duplicate'

      // Selected and edited data
      selectedQuestionGroup: null,
      selectedQuestions: [],

      editedGroup: {
        text: '',
        value: null,
        type: 'post',
        questionIds: [],
      },

      // Table configuration
      questionHeaders: [
        { text: 'ID', align: 'start', value: 'id' },
        { text: 'Question', align: 'start', value: 'questionText' },
        { text: 'Category', align: 'center', value: 'categoryName' },
        { text: 'Bodypart', align: 'center', value: 'bodyPartName' },
        { text: 'Hidden', align: 'center', value: 'hiddenText' },
      ],
    }
  },

  computed: {
    ...mapState('authentication', ['accessToken']),

    // UI state computed properties
    isGroupSelected() {
      return !!this.selectedQuestionGroup?.value
    },

    hasQuestionGroups() {
      return this.questionGroups.length > 0
    },

    dialogTitle() {
      const titles = {
        create: 'Create Question Group',
        edit: 'Edit Question Group',
        duplicate: 'Duplicate Question Group',
      }
      return titles[this.dialogMode] || 'Question Group'
    },

    // Filtered question sets
    screeningQuestions() {
      return this.allQuestions.filter((q) => q.categoryId === 3)
    },

    criticalThinkingQuestions() {
      return this.allQuestions.filter((q) => q.categoryId !== 3)
    },

    // Questions to display based on current group type
    displayedQuestions() {
      if (!this.isGroupSelected) return []

      return this.selectedQuestionGroup.type === 'pre' ? this.screeningQuestions : this.criticalThinkingQuestions
    },
  },

  watch: {
    selectedQuestionGroup(newVal) {
      if (newVal?.questionIds) {
        this.updateSelectedQuestions(newVal.questionIds)
      } else {
        this.selectedQuestions = []
      }
    },
  },

  mounted() {
    this.loadInitialData()
  },

  methods: {
    ...mapActions('bodyService', ['getBodyParts']),

    // Data loading methods
    async loadInitialData() {
      try {
        await Promise.all([this.fetchQuestionGroups(), this.fetchQuestions()])
      } catch (error) {
        this.$notify({
          type: 'error',
          text: 'Failed to load initial data: ' + (error.message || 'Unknown error'),
        })
      }
    },

    async fetchQuestionGroups(selectedId = null) {
      try {
        const response = await apiGet('questionGroups', this.accessToken)

        if (response.data?.success) {
          this.questionGroups = response.data.data.questionGroups.map((g) => ({
            text: g.name,
            value: g.id,
            type: g.type,
            questionIds: g.questionIds || [],
          }))

          if (selectedId) {
            this.selectedQuestionGroup = this.questionGroups.find((g) => g.value === selectedId) || null
          }
        } else {
          throw new Error(response.data?.message || 'Failed to load question groups')
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load question groups' })
        console.error('Error fetching question groups:', error)
      }
    },

    async fetchQuestions() {
      try {
        const [questionsResponse, bodyParts] = await Promise.all([
          apiGet('multipleChoiceQuestions/list?type=prepared', this.accessToken),
          this.getBodyParts(this.accessToken),
        ])

        if (questionsResponse.data?.success) {
          const questions = questionsResponse.data.multipleChoiceQuestions

          this.allQuestions = questions.map((q) => ({
            ...q,
            key: uuidv4(),
            bodyPartName: bodyParts.find((b) => b.id === q.bodyPartId)?.name || 'None',
            categoryName: q.category?.name || 'None',
            hiddenText: q.hideQuestion ? 'Yes' : 'No',
          }))

          // Re-sync selections in case a group was selected before questions loaded
          if (this.selectedQuestionGroup?.questionIds) {
            this.updateSelectedQuestions(this.selectedQuestionGroup.questionIds)
          }

          return this.allQuestions
        } else {
          throw new Error(questionsResponse.data?.message || 'Failed to load questions')
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to load questions' })
        console.error('Error fetching questions:', error)
      }
    },

    // Group action methods
    updateSelectedQuestions(questionIds = []) {
      if (!questionIds.length) {
        this.selectedQuestions = []
        return
      }

      const questions =
        this.selectedQuestionGroup.type === 'pre' ? this.screeningQuestions : this.criticalThinkingQuestions

      this.selectedQuestions = questions.filter((q) => questionIds.includes(q.id))
    },

    createGroup() {
      this.dialogMode = 'create'
      this.editedGroup = {
        text: '',
        value: null,
        type: 'post',
        questionIds: [],
      }
      this.isDuplicating = false
      this.dialogVisible = true
    },

    saveQuestionSelections() {
      this.dialogMode = 'edit'
      this.editedGroup = {
        text: this.selectedQuestionGroup.text,
        id: this.selectedQuestionGroup.value,
        type: this.selectedQuestionGroup.type,
        questionIds: this.selectedQuestions.map((q) => q.id),
      }

      this.saveGroup()
    },

    duplicateGroup() {
      if (!this.selectedQuestionGroup) return

      this.dialogMode = 'duplicate'
      this.editedGroup = {
        ...this.selectedQuestionGroup,
        text: `Copy of ${this.selectedQuestionGroup.text}`,
        value: null,
        questionIds: [...this.selectedQuestionGroup.questionIds],
      }
      this.isDuplicating = true
      this.dialogVisible = true
    },

    async deleteGroup() {
      if (!this.selectedQuestionGroup) return

      if (!confirm(`Are you sure you want to delete "${this.selectedQuestionGroup.text}"?`)) {
        return
      }

      try {
        const response = await apiDelete('questionGroups/' + this.selectedQuestionGroup.value, this.accessToken)

        if (response.data?.success) {
          this.$notify({ type: 'success', text: 'Successfully deleted question group' })
          this.selectedQuestionGroup = null
          await this.fetchQuestionGroups()
        } else {
          throw new Error(response.data?.message || 'Failed to delete question group')
        }
      } catch (error) {
        this.$notify({ type: 'error', text: 'Failed to delete question group' })
        console.error('Error deleting question group:', error)
      }
    },

    // Dialog methods
    closeDialog() {
      this.dialogVisible = false
      this.editedGroup = { text: '', value: null, type: 'post', questionIds: [] }
      this.isDuplicating = false
    },

    async saveGroup() {
      try {
        if (this.dialogMode === 'edit') {
          // Update existing group
          const response = await apiPut(
            'questionGroups/' + this.editedGroup.id,
            null,
            {
              name: this.editedGroup.text,
              type: this.editedGroup.type,
              questionIds: this.editedGroup.questionIds,
            },
            this.accessToken
          )

          if (response.data?.success) {
            this.$notify({ type: 'success', text: 'Successfully updated question group' })
            await this.fetchQuestionGroups(response.data.data.id)
          } else {
            throw new Error(response.data?.message || 'Failed to update question group')
          }
        } else {
          // Create new group
          const newGroup = {
            name: this.editedGroup.text,
            type: this.editedGroup.type,
            questionIds: this.editedGroup.questionIds || [],
          }

          const response = await apiPost('questionGroups', newGroup, this.accessToken)

          if (response.data?.success) {
            this.$notify({ type: 'success', text: 'Successfully created question group' })
            await this.fetchQuestionGroups(response.data.data.id)
          } else {
            throw new Error(response.data?.message || 'Failed to create question group')
          }
        }

        this.closeDialog()
      } catch (error) {
        this.$notify({
          type: 'error',
          text: `Failed to save question group: ${error.message || 'Unknown error'}`,
        })
        console.error('Error saving question group:', error)
      }
    },
  },
}
</script>

<style scoped lang="scss">
.v-chip {
  margin-top: 0px;
}
</style>
