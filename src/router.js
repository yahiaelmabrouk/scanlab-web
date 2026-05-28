import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'
import Login from './views/Login.vue'
import Register from './views/Register.vue'
import FourOhFour from './views/FourOhFour.vue'
import { store } from '@/store/store'
import config from './config'
import { apiPost } from './util/api'
import { cancelAllInflight } from './util/api'

Vue.use(Router)

function isLoggedIn(mustBeAdmin) {
  return store.getters['authentication/isLoggedIn'] && (!mustBeAdmin || store.state.user.isAdmin)
}

// https://router.vuejs.org/guide/advanced/navigation-guards.html#global-after-hooks
function requireLogin(to, from, next, mustBeAdmin) {
  if (isLoggedIn(mustBeAdmin)) {
    next()
  } else {
    // Store where we wanted to go to be able to route there after we login
    store.dispatch(
      'authentication/setRedirectAfterLogin',
      {
        redirectAfterLogin: to,
      },
      { root: true }
    )
    next({ path: '/login' })
  }
}

function requireLoginAdmin(to, from, next) {
  return requireLogin(to, from, next, true)
}
// function requireLoginAnyone(to, from, next) {
//   return requireLogin(to, from, next, false)
// }

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: Home,
      beforeEnter: requireLogin,
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
    },
    {
      path: '/register',
      name: 'register',
      component: Register,
    },
    {
      path: '/reset-password/:token',
      name: 'reset-password',
      component: () => import(/* webpackChunkName: "ResetPassword" */ './views/ResetPassword.vue'),
    },
    {
      path: '/terms-and-conditions',
      name: 'terms',
      component: () => import(/* webpackChunkName: "Terms" */ './views/Terms.vue'),
    },
    {
      path: '/privacy',
      name: 'privacy',
      component: () => import(/* webpackChunkName: "Privacy" */ './views/Privacy.vue'),
    },
    {
      path: '/resources',
      name: 'resources',
      component: () => import(/* webpackChunkName: "Privacy" */ './views/Resources.vue'),
    },
    {
      path: '/resources/preview',
      name: 'previewResource',
      component: () => import(/* webpackChunkName: "Privacy" */ './views/PreviewResource.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import(/* webpackChunkName: "Profile" */ './views/Profile.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/notifications',
      name: 'notifications',
      component: () => import(/* webpackChunkName: "Notifications" */ './views/Notifications.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/notification-preferences',
      name: 'notification-preferences',
      component: () => import(/* webpackChunkName: "NotificationPreferences" */ './views/NotificationPreferences.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/announcements',
      name: 'announcements',
      component: () => import(/* webpackChunkName: "Announcements" */ './views/Admin/Announcements.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/region-selection',
      name: 'region-selection',
      component: () => import(/* webpackChunkName: "RegionSelection" */ './views/RegionSelection.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/mri',
      name: 'mri',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "MRI" */ './views/MRI.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/student-manager',
      name: 'student-manager',
      component: () => import(/* webpackChunkName: "AdminStudents" */ './views/Admin/Students.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-digital-localizer',
      name: 'manage-digital-localizer',
      component: () => import(/* webpackChunkName: "AdminStudents" */ './views/Admin/ManageDigitalLocalizer.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/dicom',
      name: 'dicom',
      component: () => import(/* webpackChunkName: "DicomGroups" */ './views/DicomGroups.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/test-dicom',
      name: 'test-dicom',
      component: () => import(/* webpackChunkName: "TestDicomGroups" */ './views/TestDicomGroups.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/question-manager',
      name: 'question-manager',
      component: () => import(/* webpackChunkName: "QuestionsManager" */ './views/QuestionsManager.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/critical-thinking-manager',
      name: 'critical-thinking-manager',
      component: () => import(/* webpackChunkName: "CriticalThinkingManager" */ './views/CriticalThinkingManager.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/cohort-manager',
      name: 'cohort-manager',
      component: () => import(/* webpackChunkName: "CohortManager" */ './views/CohortManager.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/cohort-manager/:cohortId',
      name: 'cohort-manager/cohort',
      component: () => import(/* webpackChunkName: "CohortManager" */ './views/CohortManager/Cohort.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/cohort-manager/:cohortId/students',
      name: 'cohort-manager/students',
      component: () => import(/* webpackChunkName: "CohortManager" */ './views/CohortManager/Students.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/role-manager',
      name: 'role-manager',
      component: () => import(/* webpackChunkName: "RoleManager" */ './views/RoleManager.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/admin/intervention-rules',
      name: 'intervention-rules',
      component: () => import(/* webpackChunkName: "InterventionRules" */ './views/Admin/InterventionRules.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/analysis',
      name: 'analysis',
      component: () => import(/* webpackChunkName: "Aanalysis" */ './views/Analysis.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/cohorts',
      name: 'cohorts',
      component: () => import(/* webpackChunkName: "Cohorts" */ './views/Cohorts.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/cohorts/:cohortId',
      name: 'cohorts/cohort',
      component: () => import(/* webpackChunkName: "Cohorts" */ './views/Cohorts/Cohort.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/cohorts/:cohortId/students',
      name: 'cohorts/students',
      component: () => import(/* webpackChunkName: "Cohorts" */ './views/Cohorts/Students.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/cohorts/:cohortId/students/:studentId',
      name: 'cohorts/student',
      component: () => import(/* webpackChunkName: "Cohorts" */ './views/Cohorts/Student.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/cohorts/:cohortId/students/:studentId/mri/:bodyPart',
      name: 'cohorts/student/mri',
      component: () => import(/* webpackChunkName: "Cohorts" */ './views/Cohorts/Student/MRI.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/scores',
      name: 'scores',
      component: () => import(/* webpackChunkName: "Scores" */ './views/Scores.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/scores/:regionId',
      name: 'scoresByRegion',
      component: () => import(/* webpackChunkName: "Scores" */ './views/Scores.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/scores/:testRunId',
      name: 'scoresByTestRunId',
      component: () => import(/* webpackChunkName: "Scores" */ './views/Scores.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/prepared-exams',
      name: 'preparedExams',
      component: () => import(/* webpackChunkName: "PreparedExams" */ './views/PreparedExams.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/prepared-exam-selection/:type',
      name: 'preparedExamSelection',
      component: () => import(/* webpackChunkName: "PreparedExamSelection" */ './views/PreparedExamSelection.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate',
      name: 'translate',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/critical-thinking',
      name: 'translateCriticalThinking',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/CriticalThinking.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/regions',
      name: 'translateRegions',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/Regions.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/body-parts',
      name: 'translateBodyParts',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/BodyParts.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/mri-tests',
      name: 'translateMriTests',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/MRITests.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/word-phrase',
      name: 'translateWordPhrases',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/WordPhrase.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/translate/language-map',
      name: 'LanguageMap',
      component: () => import(/* webpackChunkName: "Translate" */ './views/Translate/LanguageMap.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/manage-exam-positions',
      name: 'manageExamPositions',
      component: () =>
        import(/* webpackChunkName: "Translate" */ './views/Admin/ManageExamPositions/ManageExamPositions.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/manage-models',
      name: 'manageModels',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageModels.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-localizers',
      name: 'manageLocalizers',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageLocalizers.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-dose',
      name: 'manageDose',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageDose.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-contrast-range-presets',
      name: 'manageContrastRangePresets',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageContrastRangePresets.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-prepared-exam-questions',
      name: 'managePreparedExamQuestions',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManagePreparedExamQuestions.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-patient-physio',
      name: 'managePatientPhysio',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManagePatientPhysio.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/preview-patient-physio',
      name: 'previewPatientPhysio',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/PreviewPatientPhysio.vue'),
      beforeEnter: requireLogin,
    },
    {
      path: '/manage-dicom-boxes',
      name: 'manageDicomBoxes',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageDicomBoxes.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-resources',
      name: 'manageResources',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageResources.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-watch-towers',
      name: 'manageQuestionProbes',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageQuestionProbe.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-resource-categories',
      name: 'manageResourceCategories',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageResourceCategories.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-api-endpoints',
      name: 'manageApiEndpoints',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageApiEndpoints.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/manage-animated-volumes',
      name: 'manageAnimatedVolumes',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/Admin/ManageAnimatedVolumes.vue'),
      beforeEnter: requireLoginAdmin,
    },
    {
      path: '/weight-based-dose',
      name: 'weightBasedDose',
      component: () => import(/* webpackChunkName: "ModelTools" */ './views/WeightBasedDose.vue'),
    },
    {
      path: '/maintenance',
      name: 'Maintenance',
      component: () => import(/* webpackChunkName: "Maintenance" */ './views/Maintenance.vue'),
    },
    {
      path: '/*',
      component: FourOhFour,
    },
  ],
})

router.beforeEach((to, from, next) => {
  // kill any pending HTTP calls so they don't time out after we leave the page
  cancelAllInflight()
  // If the user is not logged in and tries to access a protected route, redirect to login
  if (config.isMaintenance) {
    if (to.name !== 'Maintenance') {
      if (store.state.authentication.userId && store.state.authentication.accessToken) {
        apiPost('logout', {}, store.state.authentication.accessToken)
        store.dispatch('authentication/setUserId', null, { root: true })
        store.dispatch('authentication/setAccessToken', null, { root: true })
      }
      next({ path: '/maintenance' })
    } else {
      if (to?.query?.scanlabMode == 'mr' && (from.name == 'Maintenance' || !from?.query?.scanlabMode)) {
        next({ path: '/login' })
        return
      }
      next()
    }
  } else if (!config.isMaintenance && to.name == 'Maintenance') {
    next({ path: '/login' })
  } else {
    next()
  }
})

export default router
