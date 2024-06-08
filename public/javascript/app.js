/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
$(function () {
  let sendNewQuery;
  class Name extends Backbone.Model {
    static initClass() {
      this.prototype.defaults = {
        first: "Simon",
        last: "Ganz",
      };
    }

    initialize() {}
  }
  Name.initClass();
  // console.log "Initializing name #{this.get('first')} #{this.get('last')}"

  class NameView extends Backbone.View {
    constructor(...args) {
      super(...args);
      this.render = this.render.bind(this);
    }

    static initClass() {
      this.prototype.className = "nameRow";

      this.prototype.tmpl = _.template($("#name-template").html());
    }

    initialize() {}
    // console.log "Initialized NameView"

    render() {
      this.$el.html(this.tmpl(this.model.toJSON()));
      // console.log "Rendering name"
      return this;
    }
  }
  NameView.initClass();

  class NameList extends Backbone.Collection {
    static initClass() {
      this.prototype.model = Name;

      this.prototype.defaultQueries = {
        rank: "high",
        frequency: "high",
        gender: "female",
        year: 0,
        race: ["any", 50],
        fstartswith: "",
        sstartswith: "",
      };
    }

    getNames(query, resetFlag) {
      if (resetFlag == null) {
        resetFlag = false;
      }
      if (resetFlag) {
        this.reset();
      }

      $.ajax({
        type: "GET",
        url: "api/names",
        data: {
          limit: 100,
          rank: query.rank,
          frequency: query.frequency,
          gender: query.gender,
          year: query.year,
          race: query.race,
          fstartswith: query.fstartswith,
          sstartswith: query.sstartswith,
        },
        dataType: "json",
        traditional: true,
        timeout: 3000,
        beforeSend(xhr, settings) {
          // Useful for debugging queries
          console.log(settings.url);
        },
        success: (data) => {
          $("#nameTable img").remove();
          _.forEach(data.names, (name) => {
            this.add({ first: name[0].name, last: name[1].name });
          });
        },
        error(xhr, type) {
          console.log("Ajax error");
        },
      });
    }
  }
  NameList.initClass();

  class AppView extends Backbone.View {
    static initClass() {
      this.prototype.el = "#ranndy";
    }

    initialize() {
      this.listenTo(nameList, "add", this.addOne);
      this.listenTo(nameList, "reset", this.reset);
      nameList.getNames(nameList.defaultQueries);
    }

    addOne(name) {
      const view = new NameView({ model: name });
      $("#nameTable").append(view.render().el);
    }

    reset() {
      $("#nameTable").empty();
      $("#nameTable").append(
        "<img src='images/ajax-loader.gif' alt='loading' />",
      );
    }
  }
  AppView.initClass();

  // Setting up Backbone App

  const nameView = new NameView({ model: name });
  var nameList = new NameList();
  const app = new AppView();

  // Infinite scroll code

  const getNamesForScroll = () =>
    // console.log "Infinite Scroll: Loading Names"
    nameList.getNames(currentQuery);

  const throttledGetNamesForScroll = _.throttle(getNamesForScroll, 2000, {
    trailing: false,
  });

  $(window).scroll(function () {
    if (
      $(window).scrollTop() + $(window).height() + 500 >=
      $(document).height()
    ) {
      throttledGetNamesForScroll();
    }
  });

  // Settings drawer code

  $("header").on("click", function () {
    if ($(".topBar").css("max-height") === "21.5rem") {
      $(".topBar").css("max-height", "3.5rem");
      $(".controlDrawer").css("margin-top", "-18rem");
      $("#nameTable").css("padding-top", "3.5rem");
      $(".fa").removeClass("fa-chevron-up").addClass("fa-chevron-down");
    } else {
      $(".topBar").css("max-height", "21.5rem");
      $(".controlDrawer").css("margin-top", "0");
      $("#nameTable").css("padding-top", "21.5rem");
      $(".fa").removeClass("fa-chevron-down").addClass("fa-chevron-up");
    }
  });

  // Debug code to start with the drawer open
  // $('.topBar').css("max-height", "25rem")
  // $('.controlDrawer').css("margin-top", "0")
  // $('#nameTable').css("padding-top", "19rem")
  // $('.settings img').addClass('clicked')

  // Changing settings code
  var currentQuery = nameList.defaultQueries;

  $("#gender, #rank, #frequency, #year, #fstartswith, #sstartswith").on(
    "change",
    function () {
      sendNewQuery(this);
      $("input[type=search]").blur();
    },
  ); // Dismiss iOS keyboard

  $("#race").on("change", function () {
    const newQuery = {};
    newQuery["race"] = [$(this).val(), 50];
    if ($(this).val() === "pctaian") {
      $("#frequency").val("any").attr("disabled", "disabled");
      newQuery["frequency"] = "any";
    } else {
      $("#frequency").removeAttr("disabled");
    }

    currentQuery = _.assign(currentQuery, newQuery);
    nameList.getNames(currentQuery, true);
  });

  sendNewQuery = function (context) {
    const newQuery = {};
    newQuery[`${$(context).attr("id")}`] = $(context).val();
    currentQuery = _.assign(currentQuery, newQuery);
    nameList.getNames(currentQuery, true);
  };
});
