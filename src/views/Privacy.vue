<!-- eslint-disable vue-i18n/no-v-html -->
/* eslint-disable */
<template>
  <!-- eslint-disable vue-i18n/no-raw-text -->
  <div class="container privacy-container shaped-card">
    <div class="row">
      <div class="col-md-auto title-container">
        <h3>{{ $t('global.privacy_policy') }}</h3>
        <p class="privacy-effective">Effective May 19, 2020</p>
      </div>
      <div class="title-line gradient-green"></div>
    </div>

    <div class="row">
      <div class="col-md-auto">
        <p
          v-html="
            $t('Privacy.intro', {
              mst: $t('Privacy.mst'),
              we: $t('Privacy.we'),
              our: $t('Privacy.our'),
              us: $t('Privacy.us'),
              termsLink: `<a href='/terms-and-conditions'>${$t('Privacy.terms_of_use')}</a>`,
              email: $t('Privacy.email'),
            })
          "
        ></p>

        <section id="collected-info-container">
          <h4>{{ $t('Privacy.information_we_collect') }}</h4>
          <p>
            {{ $t('Privacy.information_we_collect_description') }}
          </p>

          <div class="collected-info-inner">
            <h5>{{ $t('Privacy.information_you_provide') }}</h5>
            <p>
              {{ $t('Privacy.information_you_provide_description') }}
            </p>

            <h5>{{ $t('Privacy.automated_information_collection') }}</h5>
            <p>
              {{ $t('Privacy.automated_information_collection_description') }}
            </p>

            <h5>{{ $t('Privacy.user_accounts') }}</h5>
            <p>
              {{ $t('Privacy.user_accounts_description') }}
            </p>

            <h5>{{ $t('Privacy.analytics_services_and_targeted_ads') }}</h5>
            <p
              v-html="
                $t('Privacy.analytics_services_description', {
                  networkAdvertisingLink: `<a href='https://www.networkadvertising.org/' target='_blank' rel='noopener noreferrer'>${$t(
                    'Privacy.network_advertising_initiative'
                  )}</a>`,
                  digitalAdvertisingLink: `<a href='https://digitaladvertisingalliance.org/' target='_blank' rel='noopener noreferrer'>${$t(
                    'Privacy.digital_advertising_alliance'
                  )}</a>`,
                  googleOptOutLink: `<a href='${$t('Privacy.google_analytics_opt_out_url')}'>${$t(
                    'Privacy.google_analytics_opt_out_url'
                  )}</a>`,
                })
              "
            ></p>
          </div>
        </section>

        <section id="using-collected-info">
          <h4>{{ $t('Privacy.how_we_use_the_information') }}</h4>
          <p>
            {{ $t('Privacy.how_we_use_the_information_description') }}
          </p>
        </section>

        <section id="sharing-third-party">
          <h4>{{ $t('Privacy.how_and_when_we_share_information') }}</h4>
          <p>
            {{ $t('Privacy.how_and_when_we_share_information_description') }}
          </p>

          <div class="sharing-third-party-inner">
            <h5>{{ $t('Privacy.co_branded_areas') }}</h5>
            <p>
              {{ $t('Privacy.co_branded_areas_description') }}
            </p>
          </div>
        </section>

        <section id="third-party">
          <h4>{{ $t('Privacy.third_party_sites_and_services') }}</h4>

          <div class="third-party-inner">
            <h5>{{ $t('Privacy.links_to_third_party_sites') }}</h5>
            <p>
              {{ $t('Privacy.links_to_third_party_sites_description') }}
            </p>

            <h5>{{ $t('Privacy.third_party_tracking_and_do_not_track') }}</h5>
            <p>
              {{ $t('Privacy.third_party_tracking_and_do_not_track_description') }}
            </p>
          </div>
        </section>

        <section id="updating-info">
          <h4>{{ $t('Privacy.updating_your_information') }}</h4>
          <p
            v-html="
              $t('Privacy.updating_your_information_description', {
                emailLink: `<a href='mailto:${$t('Privacy.email_address')}?subject=${$t(
                  'Privacy.email_update_subject'
                )}'>${$t('Privacy.email_address')}</a>`,
              })
            "
          ></p>
        </section>

        <section id="protection">
          <h4>{{ $t('Privacy.how_we_protect_your_information') }}</h4>
          <p>
            {{ $t('Privacy.how_we_protect_your_information_description') }}
          </p>
        </section>

        <section id="non-us-transfer">
          <h4>{{ $t('Privacy.transfer_of_information_to_the_united_states') }}</h4>
          <p>
            {{ $t('Privacy.transfer_of_information_to_the_united_states_description') }}
          </p>
        </section>

        <section id="child-policy">
          <h4>{{ $t('Privacy.children_privacy') }}</h4>
          <p
            v-html="
              $t('Privacy.children_privacy_description', {
                emailLink: `<a href='mailto:${$t('Privacy.email_address')}?subject=${$t(
                  'Privacy.child_privacy_email_subject'
                )}'>${$t('Privacy.email_address')}</a>`,
              })
            "
          ></p>
        </section>

        <section id="policy-changes">
          <h4>{{ $t('Privacy.privacy_policy_changes') }}</h4>
          <p>
            {{ $t('Privacy.privacy_policy_changes_description') }}
          </p>
        </section>

        <section id="contact-us">
          <h4>{{ $t('Privacy.contact_us') }}</h4>
          <p
            v-html="
              $t('Privacy.contact_us_description', {
                emailLink: `<a href='mailto:${$t('Privacy.email_address')}'>${$t('Privacy.email_address')}</a>`,
              })
            "
          ></p>
          <div class="address">
            <p>
              9350 Turkey Lake Road <br />
              Orlando, FL 32819
            </p>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  name: 'Privacy',
  computed: {
    ...mapGetters('user', ['languageCode']),
  },
}
</script>

<style lang="scss" scoped>
.privacy-container {
  background: $white;
  text-align: left;
  margin-top: 3rem;
  padding: 1rem 3rem;
  .title-container {
    width: 100%;
    display: flex;
    .privacy-effective {
      margin: auto 0 0 auto;
    }
  }
  .title-line {
    padding: 1px;
    min-width: 95%;
    margin-left: 1rem;
    margin-bottom: 1.5rem;
  }
}
section {
  margin-top: 1.5em auto;

  div,
  h5,
  h4 {
    margin-top: 1em;
  }

  h5 {
    color: $gray-three;
    font-size: 1.15rem;
    font-weight: 700;
    margin-top: 1.5rem;
  }

  h4 {
    font-weight: 700;
    margin-top: 2rem;
  }
}

.address {
  p {
    font-weight: bold;
  }
}
</style>
