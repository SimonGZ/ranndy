$ ->

  class Name extends Backbone.Model

    defaults:
      first: 'Simon'
      last: 'Ganz'

    initialize: ->
      console.log "Initializing name #{this.get('first')} #{this.get('last')}"

  class NameView extends Backbone.View

    tagName: 'li'

    tmpl: _.template( $("#name-template").html() )

    initialize: ->
      console.log "Initialized NameView"

    render: =>
      this.$el.html( this.tmpl( this.model.toJSON() ))
      console.log "Rendering name"
      return this

  class NameList extends Backbone.Collection

    model: Name

  name = new Name({first: 'Marcus', last: 'Bowa'})  
  nameView = new NameView({model: name})
  nameList = new NameList
  
  getFirstNames = (callback) ->
      $.getJSON 'api/firstnames', (data) ->
        callback(data.firstnames)

  $('.nameBtn').on 'click', ->
    console.log("Click!")
    console.log nameList.length
    getFirstNames( (data) ->
      console.log data
      nameList.add _.map(data, (name) ->
         return first: name.name
      )
    )
    return false

  class AppView extends Backbone.View

    el: '#raandy'

    initialize: ->
      this.listenTo(nameList, 'add', this.addOne)

    addOne: (name) ->
      view = new NameView(model: name)
      $('#names').append( view.render().el )

  app = new AppView
  nameList.add(new Name(first:'Simon', last: 'Ganz'))
  nameList.add(new Name(first:'JC', last: 'Ganz'))