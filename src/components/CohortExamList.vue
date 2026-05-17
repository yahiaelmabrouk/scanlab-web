<template>
  <div>
    <v-checkbox
      v-if="student"
      hide-details
      :label="$t('CohortManager.overwrite_cohort_student_settings')"
      v-model="student.settingsFromManager.overwriteBodyPartSettings"
      @change="saveSettings()"
    />

    <v-btn
      v-if="student && student.settingsFromManager.overwriteBodyPartSettings"
      class="mt-2"
      small
      text
      color="buttonBlue"
      @click="resetToCohortSettings()"
    >
      {{ $t('CohortManager.reset_to_cohort_settings') }}
    </v-btn>

    <v-simple-table v-if="(!student || student.settingsFromManager.overwriteBodyPartSettings) && !isCTLab">
      <thead>
        <tr>
          <th class="text-left">{{ $t('global.region') }}</th>
          <th class="text-left">{{ $t('global.body_part') }}</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="region in examListRegions">
          <CohortExamTableRegion
            :region="region"
            :key="region.name"
            :is-updating="isUpdating"
            @toggleRegion="toggleRegion"
          />
          <CohortExamTableBodyPart
            v-for="bodyPart in region.bodyParts"
            :body-part="bodyPart"
            :region="region"
            :key="bodyPart.id"
            :is-sandbox-enabled-by-admin="isSandboxEnabledByAdmin"
            :is-updating="isUpdating"
            @toggle-bodypart-lock="toggleBodyPartLock"
            @toggle-bodypart-sandbox="toggleBodyPartSandbox"
          />
        </template>
      </tbody>
    </v-simple-table>

    <v-simple-table v-if="(!student || student.settingsFromManager.overwriteBodyPartSettings) && isCTLab">
      <thead>
        <tr>
          <th class="text-left">{{ $t('global.body_part') }}</th>
          <th class="text-left">{{ $t('global.sub_body_part') }}</th>
          <th></th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="bodyPart in examListBodyParts">
          <CohortExamTableBodyPart
            :key="`${bodyPart.name}-${bodyPart.id}`"
            :body-part="bodyPart"
            :region="bodyPart.region"
            :is-sandbox-enabled-by-admin="false"
            :is-show-on-firt-table-cell="true"
            :is-updating="isUpdating"
            @toggle-bodypart-lock="toggleBodyPartLock"
            @toggle-bodypart-sandbox="toggleBodyPartSandbox"
          />
          <CohortExamTableBodyPart
            v-for="b in bodyPart.children"
            :body-part="b"
            :region="bodyPart"
            :key="b.id"
            :is-sandbox-enabled-by-admin="isSandboxEnabledByAdmin"
            :is-updating="isUpdating"
            @toggle-bodypart-lock="toggleBodyPartLock"
            @toggle-bodypart-sandbox="toggleBodyPartSandbox"
          />
        </template>
      </tbody>
    </v-simple-table>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import _ from 'lodash'

import CohortExamTableRegion from '@/components/CohortExamTableRegion'
import CohortExamTableBodyPart from '@/components/CohortExamTableBodyPart'

import { apiPatch } from '@/util/api'
import config from '../config'
import { BODY_PART_TYPES } from '../constants'

export default {
  name: 'CohortExamTable',
  components: {
    CohortExamTableBodyPart,
    CohortExamTableRegion,
  },
  props: {
    cohort: {
      type: Object,
      required: true,
    },
    student: {
      type: Object,
      required: false,
    },
    isAdminScreen: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      regions: [],
      bodyParts: [],
      isCTLab: config.isCTLab,
      bodyPartTypes: BODY_PART_TYPES,
      isUpdating: false,
    }
  },
  async mounted() {
    if (!this.isCTLab) {
      let regions = await this.getTestableRegions()
      regions = this.filterRegionsLockedByAdmin(regions)
      regions = this.filterBodyPartsLockedByAdmin(regions)
      this.regions = regions
    } else {
      let bodyParts = await this.getTestableBodyParts()
      bodyParts = this.filterRegionsLockedOfBodyPartsByAdmin(bodyParts)
      bodyParts = this.filterBodyPartsLockedOfBodyPartsByAdmin(bodyParts)
      bodyParts = _.sortBy(bodyParts, 'name')
      bodyParts = this.listBodyPartsToTree(bodyParts)
      bodyParts = _.sortBy(bodyParts, 'name')
      this.bodyParts = bodyParts
    }
  },
  computed: {
    ...mapState('user', ['isAdmin']),
    ...mapState('authentication', ['accessToken']),
    showAdminScreen() {
      return this.isAdmin && this.isAdminScreen
    },
    settings() {
      if (this.student) {
        return this.student.settingsFromManager
      } else {
        const setting = this.showAdminScreen ? 'adminSettings' : 'settings'
        return this.cohort[setting]
      }
    },
    examListRegions() {
      return _.map(_.cloneDeep(this.regions), (region) => {
        region.locked = this.isRegionLocked(region)

        region.bodyParts.forEach((bodyPart) => {
          bodyPart.locked = region.locked ? true : this.isBodyPartLocked(bodyPart)
          bodyPart.isSandbox = region.isSandbox ? true : this.isBodyPartSandboxed(bodyPart)
        })
        return region
      })
    },
    examListBodyParts() {
      return _.map(_.cloneDeep(this.bodyParts), (bodyPart) => {
        bodyPart.locked = !_.some(bodyPart.children, (b) => !this.isBodyPartLocked(b))
        bodyPart.isSandbox = _.some(bodyPart.children, (b) => this.isBodyPartSandboxed(b))

        bodyPart.children.forEach((b) => {
          b.locked = this.isBodyPartLocked(b)
          b.isSandbox = this.isBodyPartSandboxed(b)
        })
        return bodyPart
      })
    },
    isSandboxEnabledByAdmin() {
      return this.cohort.adminSettings.isSandboxEnabled
    },
  },
  methods: {
    ...mapActions('bodyService', ['getTestableRegions', 'getTestableBodyParts', 'getBodyParts']),
    listBodyPartsToTree(list) {
      const bases = []

      for (let i = 0; i < list.length; i++) {
        if (!list[i].baseId && !_.find(bases, (el) => el.id == list[i].id)) {
          bases.push(list[i])
        } else if (list[i].base && !_.find(bases, (el) => el.id == list[i].base.id)) {
          bases.push({ ...list[i], ...list[i].base })
        }
      }

      for (let i = 0; i < bases.length; i++) {
        bases[i].children = list
          .filter((el) => el.id == bases[i].id || el.baseId == bases[i].id)
          .sort((a, b) => this.getBodyPartTypeIndex(a) - this.getBodyPartTypeIndex(b))
          .map((el) => {
            const subBodyPartType = this.getBodyPartType(el)
            return {
              contrastTypes: el.contrastTypes,
              id: el.id,
              name: subBodyPartType ? subBodyPartType : el.name,
              children: [],
            }
          })
      }

      return bases
    },
    getBodyPartType(bodyPart) {
      let type = ''
      const typeItem = _.find(this.bodyPartTypes, (el) => _.get(bodyPart, ['contrastTypes', el.id]))
      if (typeItem) {
        type = typeItem.name
      }

      return type
    },
    getBodyPartTypeIndex(bodyPart) {
      return _.findIndex(this.bodyPartTypes, (el) => _.get(bodyPart, ['contrastTypes', el.id]))
    },
    isRegionLocked(region) {
      let lockedRegions = this.settings.lockedRegions || []
      return lockedRegions.some((lockedRegionId) => lockedRegionId === region.id)
    },
    isBodyPartLocked(bodyPart) {
      let lockedBodyParts = this.settings.lockedBodyParts || []
      return lockedBodyParts.some((lockedBodyPartId) => lockedBodyPartId === bodyPart.id)
    },
    isBodyPartSandboxed(bodyPart) {
      let sandboxedBodyParts = this.settings.sandboxedBodyParts || []

      return sandboxedBodyParts.some((sandboxedBodyPartId) => sandboxedBodyPartId === bodyPart.id)
    },
    filterRegionsLockedByAdmin(regions) {
      if (this.showAdminScreen) return regions
      return regions.filter((r) => !_.includes(_.get(this.cohort, 'adminSettings.lockedRegions'), r.id))
    },
    filterBodyPartsLockedByAdmin(regions) {
      if (this.showAdminScreen) return regions
      return regions.map((r) => {
        const filteredParts = r.bodyParts.filter(
          (part) => !_.includes(_.get(this.cohort, 'adminSettings.lockedBodyParts'), part.id)
        )
        r.bodyParts = filteredParts
        return r
      })
    },
    filterRegionsLockedOfBodyPartsByAdmin(bodyParts) {
      if (this.showAdminScreen) return bodyParts
      return bodyParts.filter((b) => !_.includes(_.get(this.cohort, 'adminSettings.lockedRegions'), b.region?.id))
    },
    filterBodyPartsLockedOfBodyPartsByAdmin(bodyParts) {
      if (this.showAdminScreen) return bodyParts
      return bodyParts.filter((b) => !_.includes(_.get(this.cohort, 'adminSettings.lockedBodyParts'), b.id))
    },
    async toggleRegion(region) {
      const shouldLock = !region.locked
      const regionBodyParts = await this.getBodyParts({ regionId: region.id })
      const bodyPartIds = regionBodyParts.map((bp) => bp.id)

      // Build delta payload
      const changes = shouldLock
        ? {
            lockedRegions: { add: [region.id] },
            lockedBodyParts: { add: bodyPartIds },
            sandboxedBodyParts: { remove: bodyPartIds },
          }
        : {
            lockedRegions: { remove: [region.id] },
            lockedBodyParts: { remove: bodyPartIds },
          }

      await this.updateBodyPartSettings(changes)
    },
    async toggleBodyPartLock(bodyPart) {
      const shouldLock = !bodyPart.locked

      // Collect IDs to modify
      const ids = [bodyPart.id]
      if (this.isCTLab && bodyPart.children?.length) {
        ids.push(...bodyPart.children.map((c) => c.id))
      }

      // Build delta payload
      // When locking, also remove from sandbox
      const changes = shouldLock
        ? { lockedBodyParts: { add: ids }, sandboxedBodyParts: { remove: ids } }
        : { lockedBodyParts: { remove: ids } }

      await this.updateBodyPartSettings(changes)
    },
    async toggleBodyPartSandbox(bodyPart) {
      const shouldEnable = bodyPart.targetSandboxState ?? !bodyPart.isSandbox

      // Collect IDs to modify
      const ids = [bodyPart.id]
      if (this.isCTLab && bodyPart.children?.length) {
        bodyPart.children.forEach((child) => {
          // Only add children that aren't locked
          if (!this.settings.lockedBodyParts?.includes(child.id)) {
            ids.push(child.id)
          }
        })
      }

      // Build delta payload
      const changes = {
        sandboxedBodyParts: shouldEnable ? { add: ids } : { remove: ids },
      }

      await this.updateBodyPartSettings(changes)
    },
    async updateBodyPartSettings(changes) {
      this.isUpdating = true
      try {
        const target = this.showAdminScreen ? 'adminSettings' : 'settings'
        let response

        if (this.student) {
          response = await apiPatch(`cohortStudents/${this.student.id}/body-part-settings`, changes, this.accessToken)
        } else {
          response = await apiPatch(
            `cohorts/${this.cohort.id}/body-part-settings?target=${target}`,
            changes,
            this.accessToken
          )
        }

        if (response.data?.success) {
          const data = response.data.data
          if (data.sandboxedBodyParts !== undefined) {
            this.$set(this.settings, 'sandboxedBodyParts', data.sandboxedBodyParts)
          }
          if (data.lockedBodyParts !== undefined) {
            this.$set(this.settings, 'lockedBodyParts', data.lockedBodyParts)
          }
          if (data.lockedRegions !== undefined) {
            this.$set(this.settings, 'lockedRegions', data.lockedRegions)
          }
          this.$notify({ type: 'success', text: 'Updated!' })
        } else {
          throw new Error('Update failed')
        }
      } catch (error) {
        console.error('Failed to update body part settings:', error)
        this.$notify({ type: 'error', text: 'Failed to update' })
      } finally {
        this.isUpdating = false
      }
    },
    async resetToCohortSettings() {
      const cohortBodyPartSettings = _.cloneDeep(
        _.pick(this.cohort.settings, ['lockedBodyParts', 'lockedRegions', 'sandboxedBodyParts'])
      )
      // Keep the override enabled so the manager can continue customizing from the cohort defaults.
      const settings = {
        overwriteBodyPartSettings: true,
        lockedBodyParts: cohortBodyPartSettings.lockedBodyParts || [],
        lockedRegions: cohortBodyPartSettings.lockedRegions || [],
        sandboxedBodyParts: cohortBodyPartSettings.sandboxedBodyParts || [],
      }

      const response = await apiPatch(
        `cohortStudents/${this.student.id}`,
        { settingsFromManager: settings },
        this.accessToken
      )

      if (response.data && response.data.success) {
        Object.assign(this.settings, settings)
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
    async saveSettings(settings = {}) {
      const setting = this.showAdminScreen ? 'adminSettings' : 'settings'

      this.$emit('update-settings', settings)
      let response

      if (this.student) {
        const isEnablingOverride = !!this.student.settingsFromManager.overwriteBodyPartSettings
        settings.overwriteBodyPartSettings = isEnablingOverride

        // When enabling override, include current body part settings
        // (already populated in memory by Student.vue from cohort settings)
        if (isEnablingOverride) {
          settings.sandboxedBodyParts = this.student.settingsFromManager.sandboxedBodyParts || []
          settings.lockedBodyParts = this.student.settingsFromManager.lockedBodyParts || []
          settings.lockedRegions = this.student.settingsFromManager.lockedRegions || []
        }

        response = await apiPatch(
          `cohortStudents/${this.student.id}`,
          { settingsFromManager: settings },
          this.accessToken
        )
      } else {
        response = await apiPatch(
          `cohorts/${this.cohort.id}`,
          {
            [setting]: settings,
          },
          this.accessToken
        )
      }

      if (response.data && response.data.success) {
        Object.assign(this.settings, settings)
        this.$notify({ type: 'success', text: 'Updated!' })
      } else {
        this.$notify({ type: 'error', text: 'Failed' })
      }
    },
  },
}
</script>

<style scoped lang="scss"></style>
