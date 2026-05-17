<template>
  <div class="login">
    <div v-if="!isLoggedIn">
      <div raised class="mx-auto login-card" max-width="500" min-height="300">
        <img v-if="!isCTLab" class="svg login-logo" slot="extra" src="@/assets/svg/scanlab-logo-vertical.svg" />
        <img v-else class="svg login-logo" slot="extra" src="@/assets/svg/scanlab-logo-ct-vertical.png" />
        <v-form @submit.prevent="login({ email, password })" v-if="!showPasswordReset">
          <h1 class="login-title">{{ $t('global.login', languageCode) }}</h1>
          <v-row class="justify-content-md-center">
            <v-col sm="12" md="11" lg="10">
              <v-row>
                <v-col sm="3" class="pb-0">
                  <div class="login-input-title">{{ $t('global.email', languageCode) }}</div>
                </v-col>
                <v-col sm="9" class="pb-0">
                  <v-text-field filled autocomplete="email" v-model.trim="email" />
                </v-col>
                <v-col sm="3" class="pb-0">
                  <div class="login-input-title">{{ $t('global.password', languageCode) }}</div>
                </v-col>
                <v-col sm="9" class="pb-0">
                  <v-text-field
                    filled
                    autocomplete="current-password"
                    :type="'password'"
                    v-model="password"
                    data-private
                  />
                </v-col>
              </v-row>
              <v-btn
                x-large
                tile
                depressed
                type="submit"
                color="primary"
                class="login-btn"
                v-text="$t('global.login', languageCode)"
              />
            </v-col>
          </v-row>
        </v-form>
        <v-form @submit.prevent="attemptPasswordReset(email)" v-else>
          <h1 v-text="$t('global.reset_password')" />
          <v-row class="justify-content-md-center">
            <v-col sm="6">
              <v-text-field
                autocomplete="email"
                v-model="email"
                :required="true"
                :type="'email'"
                :placeholder="$t('global.email', languageCode)"
              />
              <v-btn type="submit" color="primary" v-text="$t('Login.send_password_reset', languageCode)" />
            </v-col>
          </v-row>
        </v-form>
        <div class="login-footer">
          <div class="register-link">
            {{ $t('Login.dont_have_account', languageCode) }}
            <router-link to="/register">{{ $t('Login.register_here', languageCode) }}</router-link>
          </div>
          <v-btn
            small
            text
            @click="togglePasswordReset"
            class="forgot-password-btn"
            v-text="
              showPasswordReset
                ? $t('Login.return_to_login', languageCode)
                : $t('Login.forgot_your_password', languageCode)
            "
          />
        </div>
      </div>
    </div>
    <div v-else>
      {{ $t('Login.thanks', languageCode) }}
    </div>

    <WebGLSupportCheckModal></WebGLSupportCheckModal>
  </div>
</template>

<script>
import Vue from 'vue'
import { mapState, mapGetters, mapActions, mapMutations } from 'vuex'
import WebGLSupportCheckModal from '../components/WebGLSupportCheckModal.vue'
import config from '../config'
import { apiPost } from '../util/api'
import log from 'loglevel'

export default {
  name: 'Login',
  components: { WebGLSupportCheckModal },
  data() {
    return {
      email: '',
      password: '',
      showPasswordReset: false,
      isCTLab: config.isCTLab,
    }
  },

  computed: {
    ...mapState('authentication', ['forceLogout', 'accessToken']),
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
  },
  async mounted() {
    if (this.forceLogout) {
      // Log out here after confirming resume or abandon
      try {
        await apiPost('logout', {}, this.accessToken)
        Vue.notify({ text: 'Logged out' })
      } catch (e) {
        log.debug('ERROR logging out', e)
      }
      // Update authentication module states
      this.setForceLogout(false)
      this.setUserId(null)
      this.setAccessToken(null)
      // Update user module states
      this.setEmail(null)
      this.setIsAdmin(null)
    } else if (this.isLoggedIn) {
      // Don't stay here if already logged in
      this.$router.replace({ path: '/' })
    }
  },
  methods: {
    ...mapActions('authentication', ['login', 'sendPasswordReset']),
    ...mapMutations('authentication', ['setForceLogout', 'setAccessToken', 'setUserId']),
    ...mapMutations('user', ['setEmail', 'setIsAdmin']),

    togglePasswordReset() {
      this.showPasswordReset = !this.showPasswordReset
    },

    async attemptPasswordReset(email) {
      if (await this.sendPasswordReset({ email })) {
        this.togglePasswordReset()
      }
    },
  },
}
</script>

<style lang="scss">
.login-title {
  font-size: 1.5rem;
}
.login-logo {
  max-width: 175px;
  margin: 0 auto 2rem auto;
  border-bottom: 0.5px solid #91aec1;
  padding-bottom: 2rem;
}

.login-card {
  margin-top: 100px;
  border-radius: 0px 16px;
  padding: 3rem;
  width: 40%;
  background-color: #fffef9;
  box-shadow: 2px 2px 10px #bebebe;
}

.login-input-title {
  margin-top: 0.5rem;
  font-weight: 700;
  flex: 1;
  text-align: left;
}

.login-btn {
  padding: 0 2rem;
  width: 100%;
  margin: 1rem 0;
}

.login-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
}

.forgot-password-btn {
  padding-right: 0 !important;
}

.register-link {
  font-size: 0.875rem;

  a {
    color: var(--v-primary-base);
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}

@media only screen and (max-width: 700px) {
  .login-card {
    width: 300px;
  }
  .v-form {
    padding: 12%;
  }
  .login-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
