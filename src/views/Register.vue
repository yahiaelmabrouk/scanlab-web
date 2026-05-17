<template>
  <div class="register">
    <div v-if="!isLoggedIn">
      <div class="mx-auto register-card" max-width="500" min-height="300">
        <img v-if="!isCTLab" class="svg register-logo" slot="extra" src="@/assets/svg/scanlab-logo-vertical.svg" />
        <img v-else class="svg register-logo" slot="extra" src="@/assets/svg/scanlab-logo-ct-vertical.png" />

        <!-- <img v-if="!isCTLab" class="svg login-logo" slot="extra" src="@/assets/svg/scanlab-logo-vertical.svg" />
        <img v-else class="svg login-logo" slot="extra" src="@/assets/svg/scanlab-logo-ct-vertical.png" /> -->

        <h1 class="register-title">{{ $t('global.register', languageCode) }}</h1>
        <v-form ref="form" @submit.prevent="onFormSubmit">
          <v-row class="justify-content-md-center">
            <v-col sm="12" md="11">
              <v-row>
                <v-col sm="12" class="pb-0">
                  <div class="">
                    {{ $t('global.questions_check_the', languageCode) }}
                    <a target="_blank" href="https://scanlabmr.com/faqs/">{{ $t('global.faq') }}</a>
                  </div>
                </v-col>
                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.registration_code', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <v-text-field
                    filled
                    class="register-input"
                    v-model="registrationCode"
                    :rules="[rules.registrationCodeRules]"
                  />
                </v-col>

                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.email', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <v-text-field
                    filled
                    autocomplete="email"
                    v-model.trim="email"
                    :rules="rules.emailRules"
                    :type="'email'"
                  />
                </v-col>
                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.confirm_email', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <v-text-field
                    filled
                    autocomplete="email"
                    v-model.trim="confirmEmail"
                    :rules="rules.emailRules.concat(rules.confirmEmailRules)"
                    :type="'email'"
                  />
                </v-col>
                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.password', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <!-- data-private is a LogRocket concept: https://docs.logrocket.com/docs/privacy#section-exclude-data-in-videos -->
                  <v-text-field
                    filled
                    :append-icon="show ? 'mdi-eye' : 'mdi-eye-off'"
                    autocomplete="new-password"
                    v-model="password"
                    :rules="[rules.passwordSize]"
                    :type="show ? 'text' : 'password'"
                    data-private
                    @click:append="show = !show"
                  />
                </v-col>

                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.legal_name', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <v-text-field filled autocomplete="name" v-model.trim="legalName" :rules="[rules.legalNameRules]" />
                </v-col>

                <v-col sm="4" class="pb-0">
                  <div class="register-input-title">{{ $t('global.nickname', languageCode) }}</div>
                </v-col>
                <v-col sm="8" class="pb-0">
                  <v-text-field filled autocomplete="nickname" v-model.trim="nickName" :rules="[rules.nickNameRules]" />
                </v-col>
              </v-row>
            </v-col>
            <v-col sm="12" md="11">
              <v-btn x-large class="register-btn" type="submit" tile depressed color="primary">
                {{ $t('global.register', languageCode) }}
              </v-btn>
              <div class="policy-text">{{ $t('global.policy_agreement', languageCode) }}</div>
              <div>
                <router-link class="mr-3" to="/privacy" target="_blank">{{
                  $t('global.privacy_policy', languageCode)
                }}</router-link>
                <span class="line">{{ line }}</span>
                <router-link class="ml-3" to="/terms-and-conditions" target="_blank">{{
                  $t('global.terms_and_conditions', languageCode)
                }}</router-link>
              </div>
            </v-col>
          </v-row>
        </v-form>
      </div>
    </div>
    <div v-else>
      {{ $t('Register.logout_to_register', languageCode) }}
    </div>
    <WebGLSupportCheckModal></WebGLSupportCheckModal>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import _ from 'lodash'
import WebGLSupportCheckModal from '../components/WebGLSupportCheckModal.vue'
import config from '../config'

export default {
  name: 'Register',
  components: { WebGLSupportCheckModal },
  data() {
    return {
      line: '|',
      show: false,
      email: '',
      confirmEmail: '',
      legalName: '',
      nickName: '',
      password: '',
      registrationCode: '',
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
        emailRules: [(v) => !!v || 'E-mail is required', (v) => /.+@.+/.test(v) || 'E-mail must be valid'],
        confirmEmailRules: [(confirmEmail) => confirmEmail === this.email || 'E-mail addresses must match.'],
        legalNameRules: (v) => !!v || 'Legal Name is required',
        nickNameRules: (v) => !!v || 'Nickname is required',
        registrationCodeRules: (v) => !!v || 'Registration Code is required',
        checkboxRules: (v) => !!v || 'Please agree to Privacy Policy and Terms',
      },
      isCTLab: config.isCTLab,
    }
  },
  computed: {
    ...mapGetters('authentication', ['isLoggedIn']),
    ...mapGetters('user', ['languageCode']),
  },
  methods: {
    ...mapActions('authentication', ['register']),
    onFormSubmit: function () {
      if (this.$refs.form.validate()) {
        this.register({
          email: this.email,
          legalName: this.legalName,
          nickName: this.nickName,
          password: this.password,
          registrationCode: this.registrationCode,
        })
      }
    },
  },
}
</script>

<style scoped lang="scss">
.register-card {
  margin-top: 100px;
  border-radius: 0px 16px;
  padding: 3rem;
  width: 40%;
  background-color: #fffef9;
  box-shadow: 2px 2px 10px #bebebe;
}

.form-inputs {
  display: flex;
  width: 80%;
  margin-top: 1rem;
}

.register-logo {
  max-width: 175px;
  margin: 0 auto 2rem auto;
  border-bottom: 0.5px solid #91aec1;
  padding-bottom: 2rem;
}

.register-title {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.register-input-title {
  margin-top: 0.5rem;
  font-weight: 700;
  flex: 1;
  text-align: left;
}

.register-input {
  display: inline;
  flex: 2;
}

.register-btn {
  padding: 0 2rem;
  width: 100%;
}

.policy-text {
  background-color: #c9eff8;
  padding: 1rem;
  margin: 2rem 0;
  font-style: italic;
}

.line {
  color: $ocean;
}

@media only screen and (max-width: 1024px) {
  .register-card {
    width: 60%;
  }
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
