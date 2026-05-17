# scanlab

## Setup
```
Install Volta from https://volta.sh/
yarn install
```

### Running
- Make sure Scanlab-API server is running locally
- Run local dev webserver by running `yarn cruise`

### Compiles and minifies for production
```
yarn run build
```
Note that Netlify is configured to automatically build and deploy anything pushed to master.

### Update translations with i18n-cloud-translator
```
yarn run i18n-cloud-translator
```

We use [i18n-cloud-translator](https://github.com/fusion2004/i18n-cloud-translator) to automate updating our
translations in many languages. It uses the Google Cloud Translation API, and you'll need a `.env` file in
the project root with `GCP_KEY` and `GCP_PROJECT_ID` defined.

To reconcile merge conflicts in the translation files, it is recommended that you set up the JSON merge driver
stored in `json-merge.js`, which is also commented with the installation instructions.

### Run your tests
```
yarn run test
```

### Lints and fixes files
```
yarn run lint
```

### Run your end-to-end tests
```
yarn run test:e2e
```

### Run your unit tests
```
yarn run test:unit
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
