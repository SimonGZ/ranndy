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
      console.log query
      if resetFlag
        this.reset()
      $.getJSON 'api/names', {limit: 100, rank: query.rank, frequency: query.frequency, gender: query.gender, year: query.year}, (data) =>
        $('#nameTable img').remove()
        _.forEach(data.names, (name) =>
          this.add(first: name[0].name, last: name[1].name)
        )

    defaultQueries:
      rank: 'high'
      frequency: 'high'
      gender: 'female'
      year: 0
      race: ['any', 0]

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
    console.log "Infinite Scroll: Loading Names"
    nameList.getNames(currentQuery)

  throttledGetNamesForScroll = _.throttle(getNamesForScroll, 2000, {'trailing': false})

  $(window).scroll ->
    if $(window).scrollTop() + $(window).height() + 500 >= $(document).height()
      throttledGetNamesForScroll()

  # Settings drawer code

  $('#settingsBtn').on 'click', ->
    if $('.topBar').css("max-height") == "16rem"
      $('.topBar').css("max-height", "2rem")
      $('.controlDrawer').css("margin-top", "-14rem")
      $('#nameTable').css("padding-top", "2rem")
    else
      $('.topBar').css("max-height", "16rem")
      $('.controlDrawer').css("margin-top", "0")
      $('#nameTable').css("padding-top", "16rem")

  $('.topBar').css("max-height", "16rem")
  $('.controlDrawer').css("margin-top", "0")
  $('#nameTable').css("padding-top", "16rem")

  # Changing settings code
  currentQuery = nameList.defaultQueries

  $('#gender, #rank, #frequency, #year').on 'change', ->
    sendNewQuery(this)
    
  sendNewQuery = (context) ->
    newQuery = {}
    newQuery["#{$(context).attr('id')}"] = $(context).val()
    currentQuery = _.assign(currentQuery, newQuery)
    nameList.getNames(currentQuery, true)
