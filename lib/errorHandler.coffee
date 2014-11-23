errorLog = []

errorCodes = {
  invalid_limit: {message: 'Invalid limit specified', description: 'An invalid limit was requested. Minimum limit is 1 and maximum limit is 100.', code: 0}
  invalid_year: {message: 'Invalid year specified', description: 'An invalid year was requested. For all-time results, use year=0 (the default). For year specific results, request a year from 1880 to 2012.', code: 1},
  invalid_gender: {message: 'Invalid gender specified', description: 'An invalid gender was requested. Please request male or female names.', code: 2},
  invalid_rank: {message: 'Invalid rank specified', description: 'An invalid rank was requested. Valid ranks are high, medium, and low.', code: 3},
  invalid_race: {message: 'Invalid race specified', description: 'An invalid race was requested. Valid races are pctwhite, pctasian, pctnative, pctblack, and pcthispanic.', code: 4},
  invalid_race_pct: {message: 'Invalid race percent specified', description: 'An invalid race percent was requested or no race percent was requested. Minimum request is 1 and maximum is 99.', code: 5},
  invalid_frequency: {message: 'Invalid frequency specified', description: 'An invalid frequency was requested. Valid frequencies are high, medium, and low.', code: 6}
  invalid_startswith: {message: 'Invalid startswith specified', description: 'An invalid startswith was requested. Startswith only accepts letters.', code: 7}
}

module.exports.errorCodes = errorCodes

module.exports.errorsFound = () ->
  return errorLog.length

module.exports.addError = (error) ->
  # console.log "Logging error: #{error.message}"
  errorLog.push(error)

module.exports.listErrors = ->
  return errorLog

module.exports.clearErrors = () ->
  errorLog = []

warningLog = []

module.exports.warningsFound = () ->
  return warningLog.length

module.exports.addWarning = (warning) ->
  # console.log "Logging warning: #{warning.message}"
  warningLog.push(warning)

module.exports.listWarnings = ->
  return warningLog

module.exports.clearWarnings = () ->
  warningLog = []