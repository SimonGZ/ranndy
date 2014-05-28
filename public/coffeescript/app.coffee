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

    getNames: (name) ->
      $.getJSON 'api/names', {limit: 100, rank: 'high', frequency: 'high', gender: 'male'}, (data) =>
        _.forEach(data.names, (name) =>
          this.add(first: name[0].name, last: name[1].name)
        )

  class AppView extends Backbone.View

    el: '#raandy'

    initialize: ->
      this.listenTo(nameList, 'add', this.addOne)

    addOne: (name) ->
      view = new NameView(model: name)
      $('#names').append( view.render().el )

  nameView = new NameView({model: name})
  nameList = new NameList
  app = new AppView

  loading = false

  getNames = (callback) ->
    $.getJSON 'api/names', {limit: 100, rank: 'high', frequency: 'high', gender: 'male'}, (data) ->
      callback(data)

  $('.nameBtn').on 'click', ->
    console.log "Clicked"
    nameList.getNames()
    return false

  $(window).scroll ->
    if $(window).scrollTop() + $(window).height() >= $(document).height() and loading == false
      console.log "BOTTOM"
      $('nameBtn').click()