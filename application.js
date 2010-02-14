if ("undefined" == typeof console) var console = { log : function(what) {}, info : function(what) {}, error : function(what) {}  }

function l() { console.log(arguments) }

var iframe_loaded = function() {
  $('#dialog #loading').fadeOut();
  $('#dialog iframe').show();
};

function WikipediaHistory(data) {

  var $this = this;
  var history_page = 'http://en.wikipedia.org/w/index.php?title=Metal_umlaut&diff=prev&oldid=';
  
  initialize(data);

  function initialize(data) {
    $this.data = data;
    $('#dialog').dialog({ autoOpen: false,
                          title: 'Wikipedia',
                          width: $(document).width()*0.8,
                          height: $(document).height()*0.8,
                          close: function(event, ui) { $('#dialog iframe').hide() } })
    draw();
    return this;
  };

  // Adapted from http://raphaeljs.com/analytics.html
  function draw() {
    // Setup drawing
    var width = 1000,
        height = 450,
        leftgutter = 30,
        bottomgutter = 80,
        topgutter = 20,
        dot_color = '#004cbf',
        dot_diameter = 4,
        dot_stroke = 1,
        r = Raphael("holder", width, height),
        txt_white  = {font: '12px Arial', fill: "#fff"},
        txt_normal = {font: '12px Arial', fill: "#000"},
        txt_small  = {font: '9px Arial', fill: "#666"};
    var path = r.path().attr({stroke: dot_color, "stroke-width": 4, "stroke-linejoin": "round"}),
        frame = r.rect(10, 10, 100, 40, 5).attr({fill: "#000", stroke: "none"}).hide(),
        leave_timer,
        label = [],
        is_label_visible = false,
        blanket = r.set();
    var total_revision_count = 0;

    label[0] = r.text(60, 10, "0000").attr(txt_white).hide();
    label[1] = r.text(60, 30, "--").attr(txt_small).hide();

    // Draw year and month marks
    var draw_year = function(year, x) {
      var y = height - bottomgutter + 60;
      var text = r.text(x, y, year).attr({"fill":"#999", "font-size":32}).toBack();
      r.path(["M", x+(dot_diameter*1.5)-text.getBBox().width/2, y-20, "L", x+(dot_diameter*1.5)-text.getBBox().width/2, y-60]).attr({"stroke":"#999"}).toBack();
    };
    var draw_month = function(month_index, x) {
      var month_names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      var y = height - bottomgutter + 10;
      var content = month_names[month_index];
      r.text(x-leftgutter+12, y, content).attr({"fill":"#999", "font-size":8}).rotate(45).toBack();
    };

    // Draw line at graph base
    r.path(["M", leftgutter, height - bottomgutter, "L", height - bottomgutter + width, height - bottomgutter]).attr({stroke: '#ccc'});

    // Draw first year
    var current_year = new Date($this.data[0].date).getFullYear();
    draw_year(current_year, leftgutter*2);

    // Iterate over months
    for (var i = 0, ii = $this.data.length; i < ii; i++) {

      var x = leftgutter*2 + (20 * i);

      // Draw year mark
      var year = new Date($this.data[i].date).getFullYear();
      if (year > current_year) {
        draw_year(year, x);
        current_year = year;
      }

      // Draw month mark
      var month_index = new Date($this.data[i].date).getMonth();
      draw_month(month_index, x);

      var ratio = 0;
      var move_by = 0;

      // Iterate over revisions in month
      $.each( data[i].revisions, function(rev_index, rev) {
        total_revision_count += 1;
        // var x = leftgutter + (20 * i);
        // var x = Math.round(leftgutter + (2*dot_diameter*rev_index) + dot_stroke + move_by);

        var x = leftgutter + (20 * i);
        var y = Math.round(height - bottomgutter - (2*dot_diameter*rev_index) - dot_stroke - move_by);

        // Colorize dot according to revision impact
        if (rev.impact > 1) { var dot_color = 'green'; } else if (rev.impact < -1) { var dot_color = 'red'; } else { var dot_color = '#004cbf'; }

        // Draw revision dot
        var dot = r.circle(x, y, dot_diameter)
                   .attr({fill: dot_color, stroke: "#fff", "stroke-width": dot_stroke});
        if ( rev.impact_ratio && (rev.impact_ratio < 0 || rev.impact_ratio > 0) ) {
          ratio = Math.abs(rev.impact_ratio)+1;
          if (ratio > 5) ratio = 5;
          dot.scale(ratio, ratio);
          dot.translate( 0, -Math.round( (dot.getBBox().height - (2*dot_diameter+dot_stroke)) / 2 ) );
        }
        move_by += Math.round(dot.getBBox().height - (dot_diameter*2));

        // Add dot handlers
        $(dot.node)
          .hover(
            function () {
              var newcoord = { x: dot.getBBox().x, y: dot.getBBox().y+(dot.getBBox().height) };
              if (newcoord.x + 100 > width) { newcoord.x -= 114; };
              frame.attr({x: newcoord.x, y: newcoord.y}).show();
              label[0].attr({text: rev.author, x: +newcoord.x + 50, y: +newcoord.y + 12}).show();
              label[1].attr({text: rev.date, x: +newcoord.x + 50, y: +newcoord.y + 27}).show();
              dot.attr({fill: '#000'});
              is_label_visible = true;
            },
            function () {
              dot.attr({fill: dot_color});
              frame.hide();
              label[0].hide();
              label[1].hide();
              is_label_visible = false;
            }
          )
          .click(
            function() {
              $("#dialog #loading").show();
              $("#dialog iframe").attr("src", "");
              $("#dialog iframe").attr("src", history_page + rev.tag);
              $("#dialog").dialog('open', { title: "Wikipedia, revision number " + rev.tag });
            }
          )
    });
    frame.toFront();
    label[0].toFront();
    label[1].toFront();
    blanket.toFront();
   };

   r.text(leftgutter+60, height-bottomgutter+12, 'Displaying ' + total_revision_count + ' revisions').attr({fill: "#b2b2b2"});
  };

};

// OnLoad callback
jQuery( function() { window.app = new WikipediaHistory(data) } );
