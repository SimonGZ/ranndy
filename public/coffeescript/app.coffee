$ ->

  class Name extends Backbone.Model

    defaults:
      first: 'Simon'
      last: 'Ganz'

    initialize: ->
      # console.log "Initializing name #{this.get('first')} #{this.get('last')}"

  class NameView extends Backbone.View

    className: 'nameRow'

    tmpl: _.template( $("#name-template").html() )

    initialize: ->
      # console.log "Initialized NameView"

    render: =>
      this.$el.html( this.tmpl( this.model.toJSON() ))
      # console.log "Rendering name"
      return this

  class NameList extends Backbone.Collection

    model: Name

    getNames: (query, resetFlag=false) ->
      
      if resetFlag
        this.reset()
              
      $.ajax
        type: 'GET'
        url: 'api/names'
        data: {limit: 100, rank: query.rank, frequency: query.frequency, gender: query.gender, year: query.year, race: query.race}
        dataType: 'json'
        traditional: true
        timeout: 300
        beforeSend: (xhr, settings) ->
          # Useful for debugging queries
          # console.log settings.url
        success: (data) =>           
          $('#nameTable img').remove()
          _.forEach(data.names, (name) =>
            this.add(first: name[0].name, last: name[1].name)
          )
        error: (xhr, type) ->
          console.log "Ajax error"

    defaultQueries:
      rank: 'high'
      frequency: 'high'
      gender: 'female'
      year: 0
      race: ['any', 50]

  class AppView extends Backbone.View

    el: '#raandy'

    initialize: ->
      this.listenTo(nameList, 'add', this.addOne)
      this.listenTo(nameList, 'reset', this.reset)
      nameList.getNames(nameList.defaultQueries)

    addOne: (name) ->
      view = new NameView(model: name)
      $('#nameTable').append( view.render().el )

    reset: ->
      $('#nameTable').empty()      
      $('#nameTable').append("<img src='images/ajax-loader.gif' alt='loading' />")


  # Setting up Backbone App

  nameView = new NameView({model: name})
  nameList = new NameList
  app = new AppView

  # Infinite scroll code

  getNamesForScroll = ->
    # console.log "Infinite Scroll: Loading Names"
    nameList.getNames(currentQuery)

  throttledGetNamesForScroll = _.throttle(getNamesForScroll, 2000, {'trailing': false})

  $(window).scroll ->
    if $(window).scrollTop() + $(window).height() + 500 >= $(document).height()
      throttledGetNamesForScroll()

  # Settings drawer code

  $('#settingsBtn').on 'click', ->
    if $('.topBar').css("max-height") == "17rem"
      $('.topBar').css("max-height", "4rem")
      $('.controlDrawer').css("margin-top", "-13rem")
      $('#nameTable').css("padding-top", "4rem")
      $('.fa').removeClass('fa-chevron-up').addClass('fa-chevron-down')
    else
      $('.topBar').css("max-height", "17rem")
      $('.controlDrawer').css("margin-top", "0")
      $('#nameTable').css("padding-top", "17rem")
      $('.fa').removeClass('fa-chevron-down').addClass('fa-chevron-up')

  # Debug code to start with the drawer open
  # $('.topBar').css("max-height", "17rem")
  # $('.controlDrawer').css("margin-top", "0")
  # $('#nameTable').css("padding-top", "16rem")
  # $('.settings img').addClass('clicked')

  # Changing settings code
  currentQuery = nameList.defaultQueries

  $('#gender, #rank, #frequency, #year').on 'change', ->
    sendNewQuery(this)

  $('#race').on 'change', ->
    newQuery = {}
    newQuery['race'] = [$(this).val(), 50]
    if $(this).val() is "pctnative"
      $('#frequency')
      .val 'any'
      .attr 'disabled', 'disabled'
      newQuery['frequency'] = "any"
    else
      $('#frequency').removeAttr 'disabled'
    
    currentQuery = _.assign(currentQuery, newQuery)
    nameList.getNames(currentQuery, true)
    
  sendNewQuery = (context) ->
    newQuery = {}
    newQuery["#{$(context).attr('id')}"] = $(context).val()
    currentQuery = _.assign(currentQuery, newQuery)
    nameList.getNames(currentQuery, true)
