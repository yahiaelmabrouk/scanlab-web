import _ from 'lodash'

function getRandomPatientName(modelAttributes, testModel) {
  let firstName = ''
  let lastName = ''
  if (modelAttributes.length > 0) {
    let randomAtt = modelAttributes[Math.floor(Math.random() * modelAttributes.length)]
    if (randomAtt.firstName) {
      firstName = randomAtt.firstName
    }
    randomAtt = modelAttributes[Math.floor(Math.random() * modelAttributes.length)]
    if (randomAtt.lastName) {
      lastName = randomAtt.lastName
    }
  }

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.trim() || _.get(testModel, ['name']),
  }
}

function getRandomPatientFamilyMemberName(modelAttributes, testModel, patientName, lastName) {
  let firstName = ''
  if (modelAttributes.length > 0) {
    let randomAtt = modelAttributes[Math.floor(Math.random() * modelAttributes.length)]
    if (randomAtt.firstName) {
      firstName = randomAtt.firstName
    }
  }
  let name = `${firstName} ${lastName}`
  if (name == patientName && modelAttributes.length > 1) {
    name = getRandomPatientFamilyMemberName(modelAttributes, testModel, patientName, lastName).name
  }

  return {
    name: name.trim() || _.get(testModel, ['name']),
  }
}

export { getRandomPatientName, getRandomPatientFamilyMemberName }
