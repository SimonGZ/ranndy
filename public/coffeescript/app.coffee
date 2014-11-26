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
        data: {limit: 100, rank: query.rank, frequency: query.frequency, gender: query.gender, year: query.year, race: query.race, fstartswith: query.fstartswith, sstartswith: query.sstartswith}
        dataType: 'json'
        traditional: true
        timeout: 3000
        beforeSend: (xhr, settings) ->
          # Useful for debugging queries
          console.log settings.url
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
      fstartswith: ''
      sstartswith: ''

  class AppView extends Backbone.View

    el: '#ranndy'

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

  $('header').on 'click', ->
    if $('.topBar').css("max-height") == "25rem"
      $('.topBar').css("max-height", "3.5rem")
      $('.controlDrawer').css("margin-top", "-18rem")
      $('#nameTable').css("padding-top", "3.5rem")
      $('.fa').removeClass('fa-chevron-up').addClass('fa-chevron-down')
    else
      $('.topBar').css("max-height", "25rem")
      $('.controlDrawer').css("margin-top", "0")
      $('#nameTable').css("padding-top", "22rem")
      $('.fa').removeClass('fa-chevron-down').addClass('fa-chevron-up')

  # Debug code to start with the drawer open
  # $('.topBar').css("max-height", "25rem")
  # $('.controlDrawer').css("margin-top", "0")
  # $('#nameTable').css("padding-top", "19rem")
  # $('.settings img').addClass('clicked')

  # Changing settings code
  currentQuery = nameList.defaultQueries

  $('#gender, #rank, #frequency, #year, #fstartswith, #sstartswith').on 'change', ->
    sendNewQuery(this)
    $('input[type=search]').blur() # Dismiss iOS keyboard

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
