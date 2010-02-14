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
        marker_width = 20,
        marker_height = 3,
        marker_stroke = 1,
        r = Raphael("holder", width, height),
        txt_white  = {font: '12px Arial', fill: "#fff"},
        txt_normal = {font: '12px Arial', fill: "#000"},
        txt_small  = {font: '9px Arial', fill: "#666"};
    var frame = r.rect(10, 10, 100, 40, 5).attr({fill: "#000", stroke: "none"}).hide(),
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
      var x = Math.round( x + (marker_width/2) - 4 );
      var text = r.text(x+18, y, year).attr({"fill":"#999", "font-size":32}).toBack();
      r.path(["M", x+(marker_width)-text.getBBox().width/2, y-20, "L", x+(marker_width)-text.getBBox().width/2, y-60]).attr({"stroke":"#999"}).toBack();
    };
    var draw_month = function(month_index, x) {
      var month_names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      var y = height - bottomgutter + 10;
      var content = month_names[month_index];
      r.text(x-leftgutter+10, y+2, content).attr({"fill":"#999", "font-size":8}).rotate(45).toBack();
    };

    // Draw line at graph base
    r.path(["M", leftgutter, height - bottomgutter, "L", height - bottomgutter + width, height - bottomgutter]).attr({stroke: '#ccc'});

    // Draw first year
    var current_year = new Date($this.data[0].date).getFullYear();
    draw_year(current_year, leftgutter+10);

    // Iterate over months
    for (var i = 0, ii = $this.data.length; i < ii; i++) {

      var x = leftgutter*2 + (20 * i);

      // Draw year mark
      var year = new Date($this.data[i].date).getFullYear();
      if (year > current_year) {
        draw_year(year, x-marker_width);
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

        var x = leftgutter + (20 * i);
        var y = Math.round(height - bottomgutter - ((2*marker_height)*rev_index) - move_by);

        // Colorize dot according to revision impact
        if      (rev.impact > 1)  { var marker_color = 'green'; }
        else if (rev.impact < -1) { var marker_color = 'red'; }
        else                      { var marker_color = '#004cbf'; }

        // Draw revision marker
        var marker = r.rect(x, y, marker_width, marker_height)
                   .attr({fill: marker_color, stroke: "#fff", "stroke-width": marker_stroke});
        if ( rev.impact_ratio && (rev.impact_ratio < 0 || rev.impact_ratio > 0) ) {
          ratio = Math.abs(rev.impact_ratio)+1;
          if (ratio > 5) ratio = 5;
          // marker.scale(ratio, ratio);
          // marker.translate( 0, -Math.round( (marker.getBBox().height - (2*marker_height+marker_stroke)) / 2 ) );
        }
        move_by += Math.round(marker.getBBox().height - (marker_height*2));

        // Add dot handlers
        $(marker.node)
          .hover(
            function () {
              var newcoord = { x: marker.getBBox().x, y: marker.getBBox().y+(marker.getBBox().height) };
              if (newcoord.x + 100 > width) { newcoord.x -= 114; };
              frame.attr({x: newcoord.x, y: newcoord.y}).show();
              label[0].attr({text: rev.author, x: +newcoord.x + 50, y: +newcoord.y + 12}).show();
              label[1].attr({text: rev.date, x: +newcoord.x + 50, y: +newcoord.y + 27}).show();
              marker.attr({fill: '#000'});
              is_label_visible = true;
            },
            function () {
              marker.attr({fill: marker_color});
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

   // Display total number of displayed revisions
   r.text(width-80, height-bottomgutter+70, 'Displaying ' + total_revision_count + ' revisions').attr({fill: "#b2b2b2"}).toBack();
  };

};

// OnLoad callback
jQuery( function() { window.app = new WikipediaHistory(data) } );
