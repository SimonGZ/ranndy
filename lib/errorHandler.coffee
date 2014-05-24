errorLog = []

errorCodes = {
  invalid_limit: {message: 'Invalid limit specified', description: 'An invalid limit was requested. Minimum limit is 1 and maximum limit is 100.', code: 0}
  invalid_year: {message: 'Invalid year specified', description: 'An invalid year was requested. For all-time results, use year=0 (the default). For year specific results, request a year from 1880 to 2012.', code: 1},
  invalid_gender: {message: 'Invalid gender specified', description: 'An invalid gender was requested. Please request male or female names.', code: 2}
}

module.exports.errorCodes = errorCodes

module.exports.errorsFound = () ->
  return errorLog.length

module.exports.addError = (error) ->
  console.log "Logging error: #{error.message}"
  errorLog.push(error)

module.exports.listErrors = ->
  return errorLog

module.exports.clearErrors = () ->
  errorLog = []