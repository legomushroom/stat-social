;(function ($, window, document, undefined) {
  'use strict';

  var Pizza = {
    version : '0.1.1',

    settings : {
      donut: false,
      donut_inner_ratio: 0.615,   // between 0 and 1
      percent_offset: 35,         // relative to radius
      stroke_color: '#333',
      stroke_width: 0,
      show_text: false,           // show or hide the percentage on the chart.
      animation_speed: 500,
      always_show_text: false,
      animation_type: 'elastic'   // options: backin, backout, bounce, easein, 
                                  //          easeinout, easeout, linear
    },

    DONUT_PATH_OFFSET: 200,

    init : function (scope, options) {
      var self = this;
      this.scope = scope || document.body;

      var pies = $('[data-pie-id]', this.scope);

      $.extend(true, this.settings, options)

      if (pies.length > 0) {

        pies.each(function () {
          return self.build($(this), options);
        });
      } else {
        this.build($(this.scope), options);
      }

      this.events();
    },

    events : function () {
      var self = this;

      $(window).off('.pizza').on('resize.pizza', self.throttle(function () {
        self.init();
      }, 500));

      $(this.scope).off('.pizza').on('mouseenter.pizza mouseleave.pizza touchstart.pizza', '[data-pie-id] li', function (e) {
        var parent = $(this).parent(),
            path = Snap($('#' + parent.data('pie-id') + ' path[data-id="s' + $(this).index() + '"]')[0]),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]),
            settings = $(this).parent().data('settings');

        if (/start/i.test(e.type)) {
          $(path.node).siblings('path').each(function () {
            if (this.nodeName) {
              path.animate({
                transform: 's1 1 ' + path.node.getAttribute('data-cx') + ' ' + path.node.getAttribute('data-cy')
              }, settings.animation_speed, mina[settings.animation_type]);
              Snap($(this).next()[0]).animate({
                opacity: 0
              }, settings.animation_speed);
            }
          });
        }

        if (/enter|start/i.test(e.type)) {
          path.animate({
            transform: 's1.05 1.05 ' + path.node.getAttribute('data-cx') + ' ' + path.node.getAttribute('data-cy')
          }, settings.animation_speed, mina[settings.animation_type]);

          if (settings.show_text) {
            text.animate({
              opacity: 1
            }, settings.animation_speed);
          }
        } else {
          path.animate({
            transform: 's1 1 ' + path.node.getAttribute('data-cx') + ' ' + path.node.getAttribute('data-cy')
          }, settings.animation_speed, mina[settings.animation_type]);
          text.animate({
            opacity: 0
          }, settings.animation_speed);
        }
      });
    },

    build : function(legends, options) {
      var self = this;

      var legend = legends, graph;
      this.settings.percent_offset = ~~(legend.width()/10);


      legend.data('settings', $.extend({}, self.settings, options, legend.data('options')));
      self.data(legend, options || {});

      return self.update_DOM(self.pie(legend));
    },

    data : function (legend, options) {
      var data = [],
          count = 0;

      $('li', legend).each(function () {
        var segment = $(this);

        if (options.data) {
          data.push({
            value: options.data[segment.index()],
            text: segment.data('text'), 
            color: segment.data('color'),
            segment: segment
          });
        } else {
          data.push({
            value: segment.data('value'),
            text: segment.data('text'), 
            color: segment.data('color'),
            segment: segment
          });
        }
      });

      return legend.data('graph-data', data);
    },

    update_DOM : function (parts) {
      var legend = parts[0],
          graph = parts[1];

      return $(this.identifier(legend)).html(graph);
    },

    checkExistence:function(o){
      var existingPath = $((o.type || 'path')+'[data-id="'+o.id+'"]', o.svg.node);
      
      if (existingPath.length > 0) {
        var path = Snap(existingPath[0]);
      } else {
        var path = o.svg[o.type || 'path'].apply(o.svg, o.params || [] );
        path.node.setAttribute('data-id', o.id);
      }
      return path;
    },

    pie : function (legend) {
      // pie chart concept from JavaScript the 
      // Definitive Guide 6th edition by David Flanagan
      var settings = legend.data('settings'),
          svg = this.svg(legend, settings),
          data = legend.data('graph-data'),
          total = 0,
          angles = [],
          start_angle = 0,
          base = $(this.identifier(legend)).width() - 4;

      for (var i = 0; i < data.length; i++) {
        total += data[i].value;
      }

      for (var i = 0; i < data.length; i++) {
        angles[i] = data[i].value / total * Math.PI * 2;
      }

      if(angles.length == 1) angles[0] = Math.PI * 2 - 0.0001; // if 1

      for (var i = 0; i < data.length; i++) {
        var end_angle = start_angle + angles[i];
        var cx = (base / 2),
            cy = (base / 2),
            r = ((base / 2) * 0.85);

        if (!settings.donut) {
          // Compute the two points where our wedge intersects the circle
          // These formulas are chosen so that an angle of 0 is at 12 o'clock
          // and positive angles increase clockwise
          var x1 = cx + r * Math.sin(start_angle);
          var y1 = cy - r * Math.cos(start_angle);
          var x2 = cx + r * Math.sin(end_angle);
          var y2 = cy - r * Math.cos(end_angle);

          // This is a flag for angles larger than than a half circle
          // It is required by the SVG arc drawing component
          var big = 0;
          if (end_angle - start_angle > Math.PI) big = 1;

          // This string holds the path details
          var d = "M" + cx + "," + cy +  // Start at circle center
              " L" + x1 + "," + y1 +     // Draw line to (x1,y1)
              " A" + r + "," + r +       // Draw an arc of radius r
              " 0 " + big + " 1 " +      // Arc details...
              x2 + "," + y2 +            // Arc goes to to (x2,y2)
              " Z";                      // Close path back to (cx,cy)
        }

        var existing_path = $('path[data-id="s' + i + '"]', svg.node);

        if (existing_path.length > 0) {
          var path = Snap(existing_path[0]);
        } else {
          var path = svg.path();
        }

        var percent = (data[i].value / total) * 100.0;

        // thanks to Raphael.js
        var existing_text = $('text[data-id="s' + i + '"]', svg.node);

        if (existing_text.length > 0) {
          var text = Snap(existing_text[0]);

          text.attr({
            x: cx + (r + settings.percent_offset) * Math.sin(start_angle + (angles[i] / 2)),
            y: cy - (r + settings.percent_offset) * Math.cos(start_angle + (angles[i] / 2))
          });

        } else {

          if (data[i].text) {
            var visible_text = this.parse_options(data[i].text, percent, data[i].value);
          } else {
            var visible_text = Math.ceil(percent) + '%';
          }
          var text = path.paper.text(cx + (r + settings.percent_offset) * Math.sin(start_angle + (angles[i] / 2)), cy - (r + settings.percent_offset) * Math.cos(start_angle + (angles[i] / 2)), visible_text);
        }

        var xCenter = cx + (r - settings.percent_offset) * Math.sin(start_angle + (angles[i] / 2));
        var yCenter = cy - (r - settings.percent_offset) * Math.cos(start_angle + (angles[i] / 2));

        var left_offset = text.getBBox().width / 2;

        if (settings.always_show_text) {
          text.attr({
            x: text.attr('x') - left_offset,
            opacity: 1
          });
        } else {
          text.attr({
            x: text.attr('x') - left_offset,
            opacity: 0
          });
        }

        text.node.setAttribute('data-id', 's' + i);
        path.node.setAttribute('data-cx', cx);
        path.node.setAttribute('data-cy', cy);

        if (settings.donut) {
          this.annular_sector(path.node, {
            centerX:cx, centerY:cy,
            startDegrees:start_angle, endDegrees:end_angle,
            innerRadius: (r * settings.donut_inner_ratio), outerRadius:r
          });

        } else {
          path.attr({d:d});
        }

        path.attr({
          fill: data[i].color,
          stroke: settings.stroke_color,
          strokeWidth: settings.stroke_width
        });

        path.node.setAttribute('data-id', 's' + i);

        this.animate(path, cx, cy, settings);

        // The next wedge begins where this one ends
        start_angle = end_angle;



        if (settings.mode === 'donut-path'){

          var paperWidth = parseInt(svg.attr('width'),10); 

          if (i === 0){

            
            var consumerPath = this.checkExistence({
              svg: svg,
              id: 'consumer-path'
            });
            consumerPath.attr({ 
              d: 'M' + ((paperWidth/2) + cx) + ' ' + 2*cy+ ', L' + ((paperWidth/4) + cx) + ' '+ 2*cy + ' , L' + xCenter + ' ' + yCenter,
              stroke: 'white',
              'stroke-width': '1px',
              'fill': 'none'
            });
            consumerPath.node.setAttribute('marker-mid',   'url(#path-marker-circle)');
            consumerPath.node.setAttribute('marker-start', 'url(#path-marker-circle-start)');
            consumerPath.node.setAttribute('marker-end',   'url(#path-marker-circle)');

            var g = svg.g();

            var startX = (paperWidth/2) + cx - 100;
            var startY = 2*cy - 30;

            var icon = this.checkExistence({
              svg: svg,
              id: 'consumer-icon'
            });

            icon.attr({
              d: 'M15.793,6.086c1.626,0,3.285-1.451,3.285-2.988C19.078,1.565,17.501,0,15.872,0c-1.628,0-3.246,1.602-3.246,3.136C12.626,4.672,14.165,6.086,15.793,6.086z M22.204,10.372c0-1.506,0.105-1.362,0-2.303c-0.407-1.152-1.222-1.536-2.035-1.536c-1.739,0-2.316,0-3.661,0c-1.634,0-2.428-0.004-4.056-0.004c-0.813,0-1.344-0.052-1.948,0.467c-0.822,0.879-0.741,0.957-0.741,3.414c0,1.214,0,3.333,0,4.689c0,1.213-0.217,3.1,1.071,3.1c1.221,0,1.21-0.821,1.21-2.048c0-1.729-0.005-2.179-0.005-3.201c0-1.118-0.068-1.308,0.17-1.308c0.241,0,0.239,0.015,0.239,1.204c0,1.099-0.009,16.598-0.009,17.492c0,0.769,0.434,1.59,1.659,1.59c1.222,0,1.732-0.674,1.732-1.442c0-1.383,0-7.406,0-8.062c0-0.768,0.027-1.14,0.229-1.14c0.205,0,0.178,0.372,0.178,1.14c0,0.693,0,6.645,0,8.062c0,0.477,0.538,1.516,1.759,1.516c0.812,0,1.562-0.988,1.562-1.501c0-3.069,0.02-16.735,0.02-17.702c0-0.523-0.048-1.189,0.16-1.189c0.207,0,0.204,0.181,0.204,0.936c0,0.867,0,1.743,0,2.957c0,2.02,0.332,2.55,1.146,2.55c1.221,0,1.117-1.972,1.117-3.071C22.204,13.481,22.204,11.896,22.204,10.372z',
              fill: '#445469',
              transform: 'translate('+(startX-36)+','+(startY-25)+'), scale(1.15)'

            });

            var txt = this.checkExistence({
              svg: svg,
              id: 'consumer-text1',
              type: 'text',
              params: [startX,startY,'Consumer']
            });
            txt.attr({
              'font-family': 'Open sans',
              'font-weight': 600,
              'font-size':  17.5,
              fill: '#445469',
              x: startX,
              y: startY,
            });

            var txt2 = this.checkExistence({
              svg: svg,
              id: 'consumer-text2',
              type: 'text',
              params: [startX,startY+21,visible_text]
            });
            txt2.attr({
              'font-family': 'Open sans',
              'font-size':  18,
              'font-weight': 100,
              fill: '#445469',
              x: startX,
              y: startY+21,
            });

            var iconMain = this.checkExistence({
              svg: svg,
              id: 'main-icon'
            });

            var iconBase = 32;
            var scale = 1.75;
            var radius = r*settings.donut_inner_ratio * .7;
            var iconSize = radius*.9;
            var iconScale = iconSize/iconBase;
            var fontSize = iconSize/4.25;
            
            iconMain.attr({
              d: 'M15.754,15.053c3.002,0,5.437-2.458,5.437-5.488s-2.435-5.487-5.437-5.487c-3.002,0-5.436,2.457-5.436,5.487S12.752,15.053,15.754,15.053z M27.266,15.387c1.944,0,3.521-1.592,3.521-3.554c0-1.963-1.576-3.554-3.521-3.554s-3.521,1.591-3.521,3.554C23.745,13.795,25.321,15.387,27.266,15.387z M27.266,16.122c-2.587,0-4.685,2.094-4.73,4.693c-1.081-2.711-3.708-4.628-6.781-4.628c-2.741,0-5.126,1.525-6.377,3.778c-0.431-2.191-2.345-3.844-4.643-3.844C2.12,16.122,0,18.261,0,20.9v2.819h8.443v4.203h14.623V23.72H32V20.9C32,18.261,29.88,16.122,27.266,16.122z M4.734,15.387c1.944,0,3.521-1.592,3.521-3.554c0-1.963-1.577-3.554-3.521-3.554S1.214,9.87,1.214,11.833C1.214,13.795,2.791,15.387,4.734,15.387z',
              fill: 'white',
              transform: 'translate('+(cx-(iconSize/2))+','+(cy-(iconSize/2)-(iconSize/3))+'), scale('+iconScale+')',
              'id': 'icon'
            });

            var txtMain = this.checkExistence({
              svg: svg,
              id: 'main-circle',
              type: 'text',
              params: [cx-(radius/1.5),cy+(radius/3),'IDENTIFIED']
            });

            txtMain.attr({
              'font-family': 'Open sans',
              'font-weight': 600,
              'font-size':  fontSize,
              fill: 'white',
              x: cx-(radius/1.5),
              y: cy+(radius/3)
            });

            var txtMain2 = this.checkExistence({
              svg: svg,
              id: 'main-text2',
              type: 'text',
              params: [cx-(radius/1.5)+(radius/20),cy+(radius/1.75),'TWEETERS']
            });

            txtMain2.attr({
              'font-family': 'Open sans',
              'font-weight': 600,
              'font-size':  fontSize,
              fill: 'white',
              x: cx-(radius/1.5)+(radius/20),
              y: cy+(radius/1.75)
            });

            var circle = this.checkExistence({
              svg: svg,
              id: 'main-circle',
              type: 'circle'
            });

            circle.attr({
              stroke: 'white',
              'stroke-width': '2px',
              fill: 'none',
              r: radius,
              transform: 'translate('+(cx)+','+(cy)+')'
            });

            

          }

          if (i === 1){
              var businessPath = this.checkExistence({
                svg: svg,
                id: 'business-path'
              });

              businessPath.attr({ 
                d: 'M-' + ((this.DONUT_PATH_OFFSET/2) + settings.percent_offset - 5) + ' 50, L10 50 , L' + xCenter + ' ' + yCenter,
                stroke: 'white',
                'stroke-width': '1px',
                'fill': 'none'
              });
              businessPath.node.setAttribute('marker-mid', 'url(#path-marker-circle)');
              businessPath.node.setAttribute('marker-start', 'url(#path-marker-circle-start)');
              businessPath.node.setAttribute('marker-end', 'url(#path-marker-circle)');

              var startX = -(this.DONUT_PATH_OFFSET) + 120;
              var startY = 15;

              var icon = this.checkExistence({
                svg: svg,
                id: 'business-icon'
              });

              icon.attr({
                d: 'M24.147,24.415v-3.546c0,0-2.357,1.063-5.479,1.063c-0.466,0-0.92-0.031-1.357-0.079c0-0.129,0-0.256,0-0.383c0.468,0.062,0.935,0.103,1.372,0.103c2.536,0,5.464-1.115,5.464-1.115v-1.379c0-0.743-0.75-0.71-0.75-0.71h-0.703c0-0.4-0.375-0.356-0.375-0.356h-0.374c-0.363,0.011-0.33,0.356-0.33,0.356h-1.111v-0.356c0-0.746-0.357-1.101-0.719-1.271c0.088-0.59,0.067-1.266,0.067-1.763c0-1.497,0-3.084,0-4.608c0-1.506,0.103-1.361,0-2.302c-0.393-1.152-1.177-1.537-1.961-1.537c-1.677,0-2.231,0-3.527,0c-1.576,0-2.34-0.004-3.909-0.004c-0.783,0-1.295-0.05-1.875,0.467c-0.793,0.88-0.714,0.957-0.714,3.415c0,1.214,0,3.333,0,4.688c0,1.212-0.211,3.1,1.031,3.1c1.177,0,1.167-0.822,1.167-2.046c0-1.732-0.004-2.181-0.004-3.203c0-1.117-0.066-1.309,0.164-1.309c0.231,0,0.229,0.016,0.229,1.204c0,1.101-0.008,16.597-0.008,17.493c0,0.768,0.419,1.591,1.6,1.591c1.177,0,1.669-0.674,1.669-1.442c0-0.84,0-3.386,0-5.406c0.138,0.048,0.254,0.048,0.254,0.048h0.138c0,2.004,0,4.503,0,5.358c0,0.476,0.518,1.515,1.694,1.515c0.784,0,1.505-0.986,1.505-1.498c0-0.974,0.001-3.015,0.003-5.375h6.104C24.192,25.127,24.147,24.415,24.147,24.415zM19.971,18.013c0.1,0,0.182,0.079,0.182,0.178c0,0.098-0.082,0.179-0.182,0.179c-0.101,0-0.183-0.081-0.183-0.179C19.788,18.092,19.87,18.013,19.971,18.013z M17.96,18.002c0-0.124,0.024-0.225,0.062-0.31c0.176,0.262,0.423,0.357,0.755,0.357c0.266,0,0.464-0.104,0.615-0.272c0.037,0.13,0.033,0.235,0.033,0.235v0.356H17.96V18.002z M17.973,20.857c0-0.195,0.162-0.354,0.363-0.354h0.726c0.201,0,0.363,0.159,0.363,0.354c0,0.196,0,0.368,0,0.368l-1.465-0.012C17.96,21.214,17.973,21.054,17.973,20.857z M17.476,11.61c0.199,0,0.195,0.18,0.195,0.935c0,0.865,0,1.742,0,2.957c0,0.476,0.019,0.867,0.057,1.19c-0.165,0.059-0.303,0.141-0.41,0.237c0.002-2.179,0.004-3.818,0.004-4.132C17.321,12.274,17.274,11.61,17.476,11.61z M17.316,18.056c0.03-0.026,0.068-0.043,0.11-0.043c0.101,0,0.183,0.079,0.183,0.178c0,0.098-0.082,0.179-0.183,0.179c-0.042,0-0.08-0.018-0.112-0.042C17.314,18.234,17.314,18.145,17.316,18.056z M19.414,22.648c0,0.195-0.163,0.343-0.362,0.343h-0.728c-0.2,0-0.364-0.147-0.364-0.343c0-0.197,0-0.368,0-0.368l1.465-0.01C19.425,22.271,19.414,22.451,19.414,22.648z M13.675,6.087c1.567,0,3.166-1.452,3.166-2.986C16.841,1.565,15.32,0,13.751,0s-3.128,1.602-3.128,3.137C10.624,4.672,12.107,6.087,13.675,6.087z',
                fill: '#445469',
                transform: 'translate('+(startX-36)+','+(startY-25)+'), scale(1.15)'
              });

              var txt = this.checkExistence({
                svg: svg,
                id: 'business-text1',
                type: 'text',
                params: [startX,startY,'Business']
              });

              txt.attr({
                'font-family': 'Open sans',
                'font-weight': 600,
                'font-size':  17.5,
                fill: '#445469',
                x: startX,
                y: startY
              });

              var txt2 = this.checkExistence({
                svg: svg,
                id: 'business-text2',
                type: 'text',
                params: [startX,startY+21,visible_text]
              });
              txt2.attr({
                'font-family': 'Open sans',
                'font-size':  18,
                'font-weight': 100,
                fill: '#445469',
                x: startX,
                y: startY+21
              });

            }

          if (i === 2){
            var privatePath = this.checkExistence({
              svg: svg,
              id: 'private-path'
            });
            
            privatePath.attr({ 
              d: 'M' + ((paperWidth/2) + cx) + ' 0, L' + 1.5*cx + ' 0 , L' + xCenter + ' ' + yCenter,
              stroke: 'white',
              'stroke-width': '1px',
              'fill': 'none'
            });
            privatePath.node.setAttribute('marker-mid', 'url(#path-marker-circle)');
            privatePath.node.setAttribute('marker-start', 'url(#path-marker-circle-start)');
            privatePath.node.setAttribute('marker-end', 'url(#path-marker-circle)');

            var startX = (paperWidth/2) + cx - (paperWidth/4.5);
            var startY = 30;

            var icon = this.checkExistence({
              svg: svg,
              id: 'private-icon'
            });

            icon.attr({
              d: 'M16.343,3.708c2.972,0,5.425,2.289,5.792,5.252h3.501C25.225,3.941,21.188,0,16.267,0c-4.921,0-8.958,3.941-9.371,8.96h3.653C10.918,5.997,13.37,3.708,16.343,3.708z M24.971,11.146H7.028c-2.168,0-3.927,1.79-3.927,3.998v12.858C3.101,30.211,4.86,32,7.028,32h17.943c2.169,0,3.929-1.789,3.929-3.998V15.144C28.899,12.936,27.14,11.146,24.971,11.146z M17.67,21.914v2.904c0,0.979-0.782,1.775-1.747,1.775c-0.963,0-1.745-0.796-1.745-1.775V21.96c-0.472-0.461-0.767-1.107-0.767-1.824c0-1.398,1.114-2.532,2.488-2.532c1.372,0,2.488,1.134,2.488,2.532C18.388,20.829,18.113,21.457,17.67,21.914z',
              fill: '#445469',
              transform: 'translate('+(startX-36)+','+(startY-15)+'), scale(.9)'
            });

            var txt = this.checkExistence({
              svg: svg,
              id:   'private-text1',
              type: 'text',
              params: [startX,startY,'Private']
            });
            txt.attr({
              'font-family': 'Open sans',
              'font-weight': 600,
              'font-size':  17.5,
              fill: '#445469',
              x: startX,
              y: startY
            });

            var txt2 = this.checkExistence({
              svg: svg,
              id: 'private-text2',
              type: 'text',
              params: [startX,startY+21,visible_text]
            });
            txt2.attr({
              'font-family': 'Open sans',
              'font-size':  18,
              'font-weight': 100,
              fill: '#445469',
              x: startX,
              y: startY+21
            });

          }

          }


      }
    

      return [legend, svg.node];
    },

    animate : function (el, cx, cy, settings) {
      var self = this;

      el.hover(function (e) {
        var path = Snap(e.target),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]);

        path.animate({
          transform: 's1.05 1.05 ' + cx + ' ' + cy
        }, settings.animation_speed, mina[settings.animation_type]);

        text.touchend(function () {
          path.animate({
            transform: 's1.05 1.05 ' + cx + ' ' + cy
          }, settings.animation_speed, mina[settings.animation_type]);
        });

        if (settings.show_text) {
          text.animate({
            opacity: 1
          }, settings.animation_speed);
          text.touchend(function () {
            text.animate({
              opacity: 1
            }, settings.animation_speed);
          });
        }
      }, function (e) {
        var path = Snap(e.target),
            text = Snap($(path.node).parent()
              .find('text[data-id="' + path.node.getAttribute('data-id') + '"]')[0]);

        path.animate({
          transform: 's1 1 ' + cx + ' ' + cy
        }, settings.animation_speed, mina[settings.animation_type]);

        text.animate({
          opacity: 0
        }, settings.animation_speed);
      });
    },

    svg : function (legend, settings) {
      var container = $(this.identifier(legend)),
          svg = $('svg', container),
          width = container.width(),
          height = width;

      if (svg.length > 0) {
        svg = Snap(svg[0]);
      } else {
        svg = Snap(width, height);
      }

      var offsetX = (settings.mode === 'donut-path') ? this.DONUT_PATH_OFFSET : 0;


      svg.node.setAttribute('width', width + settings.percent_offset + offsetX);
      svg.node.setAttribute('height', height + settings.percent_offset);
      svg.node.setAttribute('viewBox', '-' + settings.percent_offset + ' -' + settings.percent_offset + ' ' + 
        (width + (settings.percent_offset * 1.5)) + ' ' + 
        (height + (settings.percent_offset * 1.5)));
      return svg;
    },


    // http://stackoverflow.com/questions/11479185/svg-donut-slice-as-path-element-annular-sector
    annular_sector : function (path, options) {
      var opts = optionsWithDefaults(options);

      var p = [ // points
        [opts.cx + opts.r2*Math.sin(opts.startRadians),
         opts.cy - opts.r2*Math.cos(opts.startRadians)],
        [opts.cx + opts.r2*Math.sin(opts.closeRadians),
         opts.cy - opts.r2*Math.cos(opts.closeRadians)],
        [opts.cx + opts.r1*Math.sin(opts.closeRadians),
         opts.cy - opts.r1*Math.cos(opts.closeRadians)],
        [opts.cx + opts.r1*Math.sin(opts.startRadians),
         opts.cy - opts.r1*Math.cos(opts.startRadians)],
      ];

      var angleDiff = opts.closeRadians - opts.startRadians;
      var largeArc = (angleDiff % (Math.PI*2)) > Math.PI ? 1 : 0;
      var cmds = [];
      cmds.push("M"+p[0].join());                                // Move to P0
      cmds.push("A"+[opts.r2,opts.r2,0,largeArc,1,p[1]].join()); // Arc to  P1
      cmds.push("L"+p[2].join());                                // Line to P2
      cmds.push("A"+[opts.r1,opts.r1,0,largeArc,0,p[3]].join()); // Arc to  P3
      cmds.push("z");                                // Close path (Line to P0)
      path.setAttribute('d',cmds.join(' '));

      function optionsWithDefaults(o){
        // Create a new object so that we don't mutate the original
        var o2 = {
          cx           : o.centerX || 0,
          cy           : o.centerY || 0,
          startRadians : (o.startDegrees || 0),
          closeRadians : (o.endDegrees   || 0),
        };

        var t = o.thickness!==undefined ? o.thickness : 100;
        if (o.innerRadius!==undefined)      o2.r1 = o.innerRadius;
        else if (o.outerRadius!==undefined) o2.r1 = o.outerRadius - t;
        else                                o2.r1 = 200           - t;
        if (o.outerRadius!==undefined)      o2.r2 = o.outerRadius;
        else                                o2.r2 = o2.r1         + t;

        if (o2.r1<0) o2.r1 = 0;
        if (o2.r2<0) o2.r2 = 0;

        return o2;
      }
    },

    parse_options : function (string, percent, value) {
      var matches = string.match(/{{(percent|value)}}/g),
          output = '';

      for (var i = 0; i < matches.length; i++) {

        if (/percent/i.test(matches[i])) {
          output = string.replace(matches[i], [Math.ceil(percent), '%'].join(''));
        }

        if (/value/i.test(matches[i])) {
          output = output.replace(matches[i], value);
        }
      }

      return output;
    },

    identifier : function (legend) {
      return '#' + legend.data('pie-id');
    },

    throttle : function(fun, delay) {
      var timer = null;
      return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
          fun.apply(context, args);
        }, delay);
      };
    }
  };

  window.Pizza = Pizza;

}($, this, this.document));
