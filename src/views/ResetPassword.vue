<template>
  <div class="register">
    <div>
      <v-card raised class="mx-auto register-card" max-width="500" min-height="300">
        <v-form @submit.prevent="resetPassword({ token, password })">
          <h2 v-text="$t('global.reset_password', languageCode)" />
          <v-row class="justify-content-md-center">
            <v-col sm="6">
              <v-text-field
                v-model="password"
                :required="true"
                :rules="[rules.passwordSize]"
                :type="'password'"
                :placeholder="$t('global.password', languageCode)"
                data-private
              />
              <v-btn type="submit" color="success" v-text="$t('global.save', languageCode)"></v-btn>
            </v-col>
          </v-row>
        </v-form>
      </v-card>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import Vue from 'vue'
import _ from 'lodash'

export default {
  name: 'ResetPassword',
  components: {},
  beforeMount() {
    if (this.isLoggedIn) {
      // Kinda weird that you tried to reset your password when you're already logged in,
      // I'm just gonna redirect you to the profile page to reset password if you want

      this.$router.push({ name: 'profile', params: { tab: 'password' } })
    }
  },
  data() {
    return {
      password: null,
      rules: {
        passwordSize: (value) => {
          if (_.size(value) > 60) {
            return 'Exceeded maximum password size'
          }
          if (_.size(value) < 8) {
            return 'Password must be at least 8 characters'
          }
          return true
        },
      },
    }
  },
  computed: {
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
    token() {
      try {
        return atob(this.$route.params.token)
      } catch (e) {
        Vue.notify({ type: 'error', text: 'Invalid token, you need a new link' })
        throw e
      }
    },
  },
  methods: {
    ...mapActions('authentication', ['resetPassword']),
  },
}
</script>

<style scoped lang="scss">
.register-card {
  margin-top: 100px;
}
@media only screen and (max-width: 700px) {
  .register-card {
    width: 300px;
  }
  .v-form {
    padding: 12%;
  }
}
</style>
