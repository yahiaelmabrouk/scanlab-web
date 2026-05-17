/* eslint-disable */
<template>
  <!-- eslint-disable vue-i18n/no-raw-text -->
  <div class="container terms-container shaped-card">
    <div class="row">
      <div class="col-md-auto title-container">
        <h3 class="terms-title">{{ $t('global.terms_and_conditions') }}</h3>
        <p class="terms-effective">Effective May 19, 2020</p>
      </div>
      <div class="title-line gradient-green"></div>
    </div>

    <div class="row">
      <div class="col-md-auto">
        <h5>{{ $t('TermsAndConditions.terms_and_conditions_of_use', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.terms_and_conditions_of_use_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.important_legal_information_about_privacy', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.the_terms_and_conditions_of_MST', languageCode) }}
          <router-link to="/privacy">{{ $t('TermsAndConditions.privacy_policy', languageCode) }}</router-link>
          {{ $t('TermsAndConditions.important_legal_information_about_privacy_description', languageCode) }}.
        </p>

        <h5>{{ $t('TermsAndConditions.modification_to_these_terms', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.modification_to_these_terms_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.access_and_use', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.access_and_use_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.user_accounts', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.user_accounts_description1', languageCode) }}
        </p>

        <p>
          {{ $t('TermsAndConditions.user_accounts_description2', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.eligibility', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.eligibility_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.intellectual_property_rights', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.intellectual_property_rights_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.indemnification', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.indemnification_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.disclaimer', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.disclaimer_description1', languageCode) }}
        </p>
        <p>
          {{ $t('TermsAndConditions.disclaimer_description2', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.limitation_of_liability', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.limitation_of_liability_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.links_to_other_websites', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.links_to_other_websites_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.other_restrictions_on_conduct', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.other_restrictions_on_conduct_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.governing_law', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.governing_law_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.severability_and_enforceability', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.severability_and_enforceability_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.termination_and_exclusion', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.termination_and_exclusion_description', languageCode) }}
        </p>

        <h5>{{ $t('TermsAndConditions.general', languageCode) }}</h5>
        <p>
          {{ $t('TermsAndConditions.general_description1', languageCode) }}
        </p>
        <p>
          {{ $t('TermsAndConditions.general_description2', languageCode) }}
        </p>
        <p class="terms-end-info">{{ $t('TermsAndConditions.terms_end_info1', languageCode) }}</p>
        <p class="terms-end-info">{{ $t('TermsAndConditions.terms_end_info2', languageCode) }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Terms',
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
}
</script>
<style scoped lang="scss">
.terms-container {
  background: $white;
  text-align: left;
  margin-top: 3rem;
  padding: 1rem 3rem;

  .title-container {
    width: 100%;
    display: flex;

    .terms-effective {
      margin: auto 0 0 auto;
    }
  }
  .title-line {
    padding: 1px;
    min-width: 95%;
    margin-left: 1rem;
  }
}
h5 {
  margin: 1.5rem 0 0.5rem 0;
  font-weight: 700;
}
.terms-end-info {
  margin: 1rem 0;
}
</style>
