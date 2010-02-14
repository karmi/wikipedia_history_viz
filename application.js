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
    var marker_width = 15,
        marker_height = 3,
        marker_stroke = 1;
    var width = $this.data.length*(marker_width+marker_stroke)+50,
        height = 450,
        leftgutter = 30,
        bottomgutter = 100,
        topgutter = 20,
        r = Raphael("timeline", width, height),
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
      var y = height - bottomgutter + 50;
      var text = r.text(x+40, y, year).attr({"fill":"#999", "font-size":32}).toBack();
      r.path(["M", x, y+10, "L", x, y-text.getBBox().height-10]).attr({"stroke":"#999"});
    };
    var draw_month = function(month_index, x) {
      var month_names = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      var y = height - bottomgutter + 10;
      var content = month_names[month_index];
      r.text(x-leftgutter+8, y+4, content).attr({"fill":"#999", "font-size":8}).rotate(90).toBack();
    };

    // Draw line at graph base
    r.path(["M", leftgutter, height - bottomgutter, "L", height - bottomgutter + width, height - bottomgutter]).attr({stroke: '#ccc'});

    // Draw first year
    var current_year = new Date($this.data[0].date).getFullYear();
    draw_year(current_year, leftgutter);

    // Iterate over months
    for (var i = 0, ii = $this.data.length; i < ii; i++) {

      var x = leftgutter + (marker_width * i);

      // Draw year mark
      var year = new Date($this.data[i].date).getFullYear();
      if (year > current_year) {
        draw_year(year, x);
        current_year = year;
      }

      // Draw month mark
      var month_index = new Date($this.data[i].date).getMonth();
      draw_month(month_index, x+(2*marker_width));

      var ratio = 0;
      var move_by = 0;
      var month_height = 0;

      // Iterate over revisions in month
      $.each( data[i].revisions, function(rev_index, rev) {
        total_revision_count += 1;

        var y = Math.round(height - bottomgutter - ((marker_height)*rev_index) - move_by);

        // Colorize dot according to revision impact
        if      (rev.impact > 1)  { var marker_color = '#29cc62'; } // Green : more lines added
        else if (rev.impact < -1) { var marker_color = '#cc144f'; } // Red   : more lines deleted
        else                      { var marker_color = '#0091e5'; } // Blue  : neutral impact

        // Colorize bots as grey
        if (rev.bot) var marker_color = '#686f74';

        // Draw revision marker
        var marker = r.rect(x, y, marker_width, marker_height).attr({fill: marker_color, stroke: "#fff", "stroke-width": marker_stroke});

        // Scale revision marker according to it's impact
        if ( rev.impact && (rev.impact < 0 || rev.impact > 0) ) {
          var impact = Math.abs(rev.impact);
          if (impact > 2*marker_height) impact = 2*marker_height; // Top limit for scaling the marker
          marker.attr({height: Math.round(marker.getBBox().height + impact)});
          marker.translate( 0, -impact );
          move_by += impact;
        };

        // Add marker handlers
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

        month_height += marker.getBBox().height+marker_stroke+topgutter;
      }); // end revision

      frame.toFront();
      label[0].toFront();
      label[1].toFront();
      blanket.toFront();

      // Adjust timeline width to data
      if (month_height > r.height) r.height = month_height;

   }; // end month

   // Display total number of displayed revisions
   r.text(leftgutter+55, height-bottomgutter+90, 'Displaying ' + total_revision_count + ' revisions').attr({fill: "#b2b2b2"}).toBack();
  };

};

// OnLoad callback
jQuery( function() { window.app = new WikipediaHistory(data) } );
