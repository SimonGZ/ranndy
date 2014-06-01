// Generated by CoffeeScript 1.7.1
var __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

$(function() {
  var AppView, Name, NameList, NameView, app, currentQuery, getNamesForScroll, nameList, nameView, sendNewQuery, throttledGetNamesForScroll;
  Name = (function(_super) {
    __extends(Name, _super);

    function Name() {
      return Name.__super__.constructor.apply(this, arguments);
    }

    Name.prototype.defaults = {
      first: 'Simon',
      last: 'Ganz'
    };

    Name.prototype.initialize = function() {};

    return Name;

  })(Backbone.Model);
  NameView = (function(_super) {
    __extends(NameView, _super);

    function NameView() {
      this.render = __bind(this.render, this);
      return NameView.__super__.constructor.apply(this, arguments);
    }

    NameView.prototype.className = 'nameRow';

    NameView.prototype.tmpl = _.template($("#name-template").html());

    NameView.prototype.initialize = function() {};

    NameView.prototype.render = function() {
      this.$el.html(this.tmpl(this.model.toJSON()));
      return this;
    };

    return NameView;

  })(Backbone.View);
  NameList = (function(_super) {
    __extends(NameList, _super);

    function NameList() {
      return NameList.__super__.constructor.apply(this, arguments);
    }

    NameList.prototype.model = Name;

    NameList.prototype.getNames = function(query, resetFlag) {
      if (resetFlag == null) {
        resetFlag = false;
      }
      if (resetFlag) {
        this.reset();
      }
      return $.ajax({
        type: 'GET',
        url: 'api/names',
        data: {
          limit: 100,
          rank: query.rank,
          frequency: query.frequency,
          gender: query.gender,
          year: query.year,
          race: query.race
        },
        dataType: 'json',
        traditional: true,
        timeout: 1000,
        beforeSend: function(xhr, settings) {},
        success: (function(_this) {
          return function(data) {
            $('#nameTable img').remove();
            return _.forEach(data.names, function(name) {
              return _this.add({
                first: name[0].name,
                last: name[1].name
              });
            });
          };
        })(this),
        error: function(xhr, type) {
          return console.log("Ajax error");
        }
      });
    };

    NameList.prototype.defaultQueries = {
      rank: 'high',
      frequency: 'high',
      gender: 'female',
      year: 0,
      race: ['any', 50]
    };

    return NameList;

  })(Backbone.Collection);
  AppView = (function(_super) {
    __extends(AppView, _super);

    function AppView() {
      return AppView.__super__.constructor.apply(this, arguments);
    }

    AppView.prototype.el = '#ranndy';

    AppView.prototype.initialize = function() {
      this.listenTo(nameList, 'add', this.addOne);
      this.listenTo(nameList, 'reset', this.reset);
      return nameList.getNames(nameList.defaultQueries);
    };

    AppView.prototype.addOne = function(name) {
      var view;
      view = new NameView({
        model: name
      });
      return $('#nameTable').append(view.render().el);
    };

    AppView.prototype.reset = function() {
      $('#nameTable').empty();
      return $('#nameTable').append("<img src='images/ajax-loader.gif' alt='loading' />");
    };

    return AppView;

  })(Backbone.View);
  nameView = new NameView({
    model: name
  });
  nameList = new NameList;
  app = new AppView;
  getNamesForScroll = function() {
    return nameList.getNames(currentQuery);
  };
  throttledGetNamesForScroll = _.throttle(getNamesForScroll, 2000, {
    'trailing': false
  });
  $(window).scroll(function() {
    if ($(window).scrollTop() + $(window).height() + 500 >= $(document).height()) {
      return throttledGetNamesForScroll();
    }
  });
  $('#settingsBtn').on('click', function() {
    if ($('.topBar').css("max-height") === "17rem") {
      $('.topBar').css("max-height", "4rem");
      $('.controlDrawer').css("margin-top", "-13rem");
      $('#nameTable').css("padding-top", "4rem");
      return $('.fa').removeClass('fa-chevron-up').addClass('fa-chevron-down');
    } else {
      $('.topBar').css("max-height", "17rem");
      $('.controlDrawer').css("margin-top", "0");
      $('#nameTable').css("padding-top", "17rem");
      return $('.fa').removeClass('fa-chevron-down').addClass('fa-chevron-up');
    }
  });
  currentQuery = nameList.defaultQueries;
  $('#gender, #rank, #frequency, #year').on('change', function() {
    return sendNewQuery(this);
  });
  $('#race').on('change', function() {
    var newQuery;
    newQuery = {};
    newQuery['race'] = [$(this).val(), 50];
    if ($(this).val() === "pctnative") {
      $('#frequency').val('any').attr('disabled', 'disabled');
      newQuery['frequency'] = "any";
    } else {
      $('#frequency').removeAttr('disabled');
    }
    currentQuery = _.assign(currentQuery, newQuery);
    return nameList.getNames(currentQuery, true);
  });
  return sendNewQuery = function(context) {
    var newQuery;
    newQuery = {};
    newQuery["" + ($(context).attr('id'))] = $(context).val();
    currentQuery = _.assign(currentQuery, newQuery);
    return nameList.getNames(currentQuery, true);
  };
});
