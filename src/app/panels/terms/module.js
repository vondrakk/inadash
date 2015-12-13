/** @scratch /panels/5
 *
 * include::panels/terms.asciidoc[]
 */

/** @scratch /panels/terms/0
 *
 * == terms
 * Status: *Stable*
 *
 * A table, bar chart or pie chart based on the results of an Elasticsearch terms facet.
 *
 */
define([
  'angular',
  'app',
  'lodash',
  'jquery',
  'kbn'
],
function (angular, app, _, $, kbn) {
  'use strict';

  var module = angular.module('kibana.panels.terms', []);
  app.useModule(module);

  module.controller('terms', function($scope, querySrv, dashboard, filterSrv, fields) {
    $scope.panelMeta = {
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: $scope.panel.spyable
        }
      ],
      editorTabs : [
        {title:'Queries', src:'app/partials/querySelect.html'}
      ],
      status  : "Stable",
      description : "Displays the results of an elasticsearch facet as a pie chart, bar chart, or a "+
        "table"
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/terms/5
       * === Parameters
       *
       * field:: The field on which to computer the facet
       */
      field   : '_type',
      /** @scratch /panels/terms/5
       * exclude:: terms to exclude from the results
       */
      exclude : [],
      /** @scratch /panels/terms/5
       * missing:: Set to false to disable the display of a counter showing how much results are
       * missing the field
       */
      missing : true,
      /** @scratch /panels/terms/5
       * other:: Set to false to disable the display of a counter representing the aggregate of all
       * values outside of the scope of your +size+ property
       */
      other   : true,
      /** @scratch /panels/terms/5
       * size:: Show this many terms
       */
      size    : 10,
      /** @scratch /panels/terms/5
       * order:: In terms mode: count, term, reverse_count or reverse_term,
       * in terms_stats mode: term, reverse_term, count, reverse_count,
       * total, reverse_total, min, reverse_min, max, reverse_max, mean or reverse_mean
       */
      order   : 'count',
      style   : { "font-size": '10pt'},
      /** @scratch /panels/terms/5
       * donut:: In pie chart mode, draw a hole in the middle of the pie to make a tasty donut.
       */
      donut   : false,
      /** @scratch /panels/terms/5
       * tilt:: In pie chart mode, tilt the chart back to appear as more of an oval shape
       */
      tilt    : false,
      /** @scratch /panels/terms/5
       * lables:: In pie chart mode, draw labels in the pie slices
       */
      labels  : true,
      /** @scratch /panels/terms/5
       * arrangement:: In bar or pie mode, arrangement of the legend. horizontal or vertical
       */
      arrangement : 'horizontal',
      /** @scratch /panels/terms/5
       * chart:: table, bar or pie
       */
      chart       : 'bar',
      /** @scratch /panels/terms/5
       * counter_pos:: The location of the legend in respect to the chart, above, below, or none.
       */
      counter_pos : 'above',
      /** @scratch /panels/terms/5
       * spyable:: Set spyable to false to disable the inspect button
       */
      spyable     : true,
      /** @scratch /panels/terms/5
       *
       * ==== Queries
       * queries object:: This object describes the queries to use on this panel.
       * queries.mode::: Of the queries available, which to use. Options: +all, pinned, unpinned, selected+
       * queries.ids::: In +selected+ mode, which query ids are selected.
       */
      queries     : {
        mode        : 'all',
        ids         : []
      },
      /** @scratch /panels/terms/5
       * multiterms:: Multi terms: used to either filterSrv
       */
      multiterms  : [],
      /** @scratch /panels/terms/5
       * fmode:: Field mode: normal or script
       */
      fmode       : 'normal',
      /** @scratch /panels/terms/5
       * tmode:: Facet mode: terms or terms_stats
       */
      tmode       : 'terms',
      /** @scratch /panels/terms/5
       * tstat:: Terms_stats facet stats field
       */
      tstat       : 'total',
      /** @scratch /panels/terms/5
       * valuefield:: Terms_stats facet value field
       */
      valuefield  : ''
    };

    _.defaults($scope.panel,_d);

    $scope.init = function () {
      $scope.hits = 0;

      $scope.$on('refresh',function(){
        $scope.get_data();
      });
      $scope.get_data();

    };

    $scope.get_data = function() {
      // Make sure we have everything for the request to complete
      if(dashboard.indices.length === 0) {
        return;
      }

      $scope.panelMeta.loading = true;
      var request,
        terms_facet,
        termstats_facet,
        results,
        boolQuery,
        queries;

      $scope.field = _.contains(fields.list,$scope.panel.field+'.raw') ?
        $scope.panel.field+'.raw' : $scope.panel.field;

      request = $scope.ejs.Request();

      //$scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);
      //queries = querySrv.getQueryObjs($scope.panel.queries.ids);

      //// This could probably be changed to a BoolFilter
      //boolQuery = $scope.ejs.BoolQuery();
      //_.each(queries,function(q) {
        //boolQuery = boolQuery.should(querySrv.toEjsObj(q));
      //});

      //// Terms mode
      //if($scope.panel.tmode === 'terms') {
        //terms_facet = $scope.ejs.TermsAggregation('terms')
          //.field($scope.field)
          //.size($scope.panel.size)
          //.order($scope.panel.order)
          //.exclude($scope.panel.exclude)
          //.facetFilter($scope.ejs.QueryFilter(
            //$scope.ejs.FilteredQuery(
              //boolQuery,
              //filterSrv.getBoolFilter(filterSrv.ids())
            //)));
        //if($scope.panel.fmode === 'script') {
          //terms_facet.scriptField($scope.panel.script)
        //}
        //request = request.facet(terms_facet).size(0);
      //}
      //if($scope.panel.tmode === 'terms_stats') {
        //termstats_facet = $scope.ejs.TermStatsFacet('terms')
          //.valueField($scope.panel.valuefield)
          //.keyField($scope.field)
          //.size($scope.panel.size)
          //.order($scope.panel.order)
          //.facetFilter($scope.ejs.QueryFilter(
            //$scope.ejs.FilteredQuery(
              //boolQuery,
              //filterSrv.getBoolFilter(filterSrv.ids())
            //)));
        //if($scope.panel.fmode === 'script') {
          //termstats_facet.scriptField($scope.panel.script)
        //}
        //request = request.facet(termstats_facet).size(0);
      //}

		_.each(queries, function(q) {
			var query = $scope.ejs.FilteredQuery(
			  querySrv.toEjsObj(q),
			  filterSrv.getBoolFilter(filterSrv.ids())
			);

			var aggr = $scope.ejs.TermsAggregation(q.id);

			if($scope.panel.mode === 'terms') {
			  aggr = aggr.field($scope.field);
			  if($scope.panel.fmode === 'script') {
				  terms_facet.scriptField($scope.panel.script)
				}
			} else if($scope.panel.mode === 'terms_stats') {
			  aggr = aggr.field($scope.field).agg($scope.ejs.StatsAggregation(q.id).keyField($scope.field).size($scope.panel.size).order($scope.panel.order));
			}
			
        request = request.agg(
          $scope.ejs.GlobalAggregation(q.id).agg(
            $scope.ejs.FilterAggregation(q.id).filter($scope.ejs.QueryFilter(query)).agg(
              aggr.interval(_interval)
            )
          )
        ).size($scope.panel.size);
      });

      // Populate the inspector panel
      $scope.populate_modal(request);

      // Populate scope when we have results
      return results.then(function(results) {
        $scope.panelMeta.loading = false;
        if(segment === 0) {
          $scope.legend = [];
          $scope.hits = 0;
          data = [];
          $scope.annotations = [];
          query_id = $scope.query_id = new Date().getTime();
        }

        // Check for error and abort if found
        if(!(_.isUndefined(results.error))) {
          $scope.panel.error = $scope.parse_error(results.error);
        }
        // Make sure we're still on the same query/queries
        else if($scope.query_id === query_id) {

          var i = 0,
            time_series,
            hits,
            counters; // Stores the bucketed hit counts.

  //var k = 0;
  //scope.data = [];
  //_.each(scope.results.facets.terms.terms, function(v) {
	//var slice;
	//if(scope.panel.tmode === 'terms') {
	  //slice = { label : v.term, data : [[k,v.count]], actions: true};
	//}
	//if(scope.panel.tmode === 'terms_stats') {
	  //slice = { label : v.term, data : [[k,v[scope.panel.tstat]]], actions: true};
	//}
	//scope.data.push(slice);
	//k = k + 1;
  //});

  //scope.data.push({label:'Missing field',
	//data:[[k,scope.results.facets.terms.missing]],meta:"missing",color:'#aaa',opacity:0});

  //if(scope.panel.tmode === 'terms') {
	//scope.data.push({label:'Other values',
	  //data:[[k+1,scope.results.facets.terms.other]],meta:"other",color:'#444'});
  //}
          
          _.each(queries, function(q) {
            var query_results = results.aggregations[q.id][q.id][q.id];
            // we need to initialize the data variable on the first run,
            // and when we are working on the first segment of the data.
            if(_.isUndefined(data[i]) || segment === 0) {
              hits = 0;
              counters = {};
            } else {
              time_series = data[i].time_series;
              hits = data[i].hits;
              counters = data[i].counters;
            }

            // push each entry into the time series, while incrementing counters
            _.each(query_results.buckets, function(entry) {
              var value;

              hits += entry.doc_count; // The series level hits counter
              $scope.hits += entry.doc_count; // Entire dataset level hits counter
              counters[entry.key] = (counters[entry.key] || 0) + entry.doc_count;

              if($scope.panel.mode === 'count') {
                value = (time_series._data[entry.key] || 0) + entry.doc_count;
              } else if ($scope.panel.mode === 'uniq') {
                value = (time_series._data[entry.key] || 0) + entry[q.id].value;
              } 
            });

            $scope.legend[i] = {query:q,hits:hits};

            data[i] = {
              info: q,
              time_series: time_series,
              hits: hits,
              counters: counters
            };

            var monitorTitle = $scope.panel.queries.check[q.id] +' for query: '+ ( q.alias || q.query );
            if ($scope.panel.queries.check[q.id] === 'threshold') {
              monitor.check(data[i].counters, monitorTitle, $scope.panel.queries.threshold[i]);
            } else if ($scope.panel.queries.check[q.id] === 'anomaly') {
              monitor.check(data[i].counters, monitorTitle);
            };

            i++;
          });

        }
        });








      
      
      //// Populate the inspector panel
      //$scope.inspector = request.toJSON();

      //results = $scope.ejs.doSearch(dashboard.indices, request);

      //// Populate scope when we have results
      //results.then(function(results) {
        //$scope.panelMeta.loading = false;
        //if($scope.panel.tmode === 'terms') {
          //$scope.hits = results.hits.total;
        //}

        //$scope.results = results;

        //$scope.$emit('render');
      //});
    };

    $scope.build_search = function(term,negate) {
      if($scope.panel.fmode === 'script') {
        filterSrv.set({type:'script',script:$scope.panel.script + ' == \"' + term.label + '\"',
          mandate:(negate ? 'mustNot':'must')});
      } else if(_.isUndefined(term.meta)) {
        filterSrv.set({type:'terms',field:$scope.field,value:term.label,
          mandate:(negate ? 'mustNot':'must')});
      } else if(term.meta === 'missing') {
        filterSrv.set({type:'exists',field:$scope.field,
          mandate:(negate ? 'must':'mustNot')});
      } else {
        return;
      }
    };

    var build_multi_search = function(term) {
      if($scope.panel.fmode === 'script') {
        return({type:'script',script:$scope.panel.script + ' == \"' + term.label + '\"',
          mandate:'either', alias: term.label});
      } else if(_.isUndefined(term.meta)) {
        return({type:'terms',field:$scope.field,value:term.label, mandate:'either'});
      } else if(term.meta === 'missing') {
        return({type:'exists',field:$scope.field, mandate:'either'});
      } else {
        return;
      }
    };

    $scope.multi_search = function() {
      _.each($scope.panel.multiterms, function(t) {
        var f = build_multi_search(t);
        filterSrv.set(f, undefined, true)
      });
      dashboard.refresh();
    };
    $scope.add_multi_search = function(term) {
      $scope.panel.multiterms.push(term);
    };
    $scope.delete_multi_search = function(term) {
      _.remove($scope.panel.multiterms, term);
    };
    $scope.check_multi_search = function(term) {
      return _.indexOf($scope.panel.multiterms, term) >= 0;
    };

    $scope.set_refresh = function (state) {
      $scope.refresh = state;
    };

    $scope.close_edit = function() {
      if($scope.refresh) {
        $scope.get_data();
      }
      $scope.refresh =  false;
      $scope.$emit('render');
    };

    $scope.showMeta = function(term) {
      if(_.isUndefined(term.meta)) {
        return true;
      }
      if(term.meta === 'other' && !$scope.panel.other) {
        return false;
      }
      if(term.meta === 'missing' && !$scope.panel.missing) {
        return false;
      }
      return true;
    };

  });

  module.directive('termsChart', function(querySrv) {
    return {
      restrict: 'A',
      link: function(scope, elem) {
        var plot;

        // Receive render events
        scope.$on('render',function(){
          render_panel();
        });

        function build_results() {

        }

        // Function for rendering panel
        function render_panel() {
          var chartData;

          build_results();

          // IE doesn't work without this
          elem.css({height:scope.panel.height||scope.row.height});

          // Make a clone we can operate on.
          chartData = _.clone(scope.data);
          chartData = scope.panel.missing ? chartData :
            _.without(chartData,_.findWhere(chartData,{meta:'missing'}));
          chartData = scope.panel.other ? chartData :
          _.without(chartData,_.findWhere(chartData,{meta:'other'}));

          // Populate element.
          require(['jquery.flot.pie'], function(){
            // Populate element
            try {
              // Add plot to scope so we can build out own legend
              if(scope.panel.chart === 'bar') {
                plot = $.plot(elem, chartData, {
                  legend: { show: false },
                  series: {
                    lines:  { show: false, },
                    bars:   { show: true,  fill: 1, barWidth: 0.8, horizontal: false },
                    shadowSize: 1
                  },
                  yaxis: { show: true, min: 0, color: "#c8c8c8" },
                  xaxis: { show: false },
                  grid: {
                    borderWidth: 0,
                    borderColor: '#c8c8c8',
                    color: "#c8c8c8",
                    hoverable: true,
                    clickable: true
                  },
                  colors: querySrv.colors
                });
              }
              if(scope.panel.chart === 'pie') {
                var labelFormat = function(label, series){
                  return '<div ng-click="build_search(panel.field,\''+label+'\')'+
                    ' "style="font-size:8pt;text-align:center;padding:2px;color:white;">'+
                    label+'<br/>'+Math.round(series.percent)+'%</div>';
                };

                plot = $.plot(elem, chartData, {
                  legend: { show: false },
                  series: {
                    pie: {
                      innerRadius: scope.panel.donut ? 0.4 : 0,
                      tilt: scope.panel.tilt ? 0.45 : 1,
                      radius: 1,
                      show: true,
                      combine: {
                        color: '#999',
                        label: 'The Rest'
                      },
                      stroke: {
                        width: 0
                      },
                      label: {
                        show: scope.panel.labels,
                        radius: 2/3,
                        formatter: labelFormat,
                        threshold: 0.1
                      }
                    }
                  },
                  //grid: { hoverable: true, clickable: true },
                  grid:   { hoverable: true, clickable: true, color: '#c8c8c8' },
                  colors: querySrv.colors
                });
              }

              // Populate legend
              if(elem.is(":visible")){
                setTimeout(function(){
                  scope.legend = plot.getData();
                  if(!scope.$$phase) {
                    scope.$apply();
                  }
                });
              }

            } catch(e) {
              elem.text(e);
            }
          });
        }

        elem.bind("plotclick", function (event, pos, object) {
          if(object) {
            scope.build_search(scope.data[object.seriesIndex]);
          }
        });

        var $tooltip = $('<div>');
        elem.bind("plothover", function (event, pos, item) {
          if (item) {
            var value = scope.panel.chart === 'bar' ? item.datapoint[1] : item.datapoint[1][0][1];
            $tooltip
              .html(
                kbn.query_color_dot(item.series.color, 20) + ' ' +
                item.series.label + " (" + value.toFixed(0) +
                (scope.panel.chart === 'pie' ? (", " + Math.round(item.datapoint[0]) + "%") : "") + ")"
              )
              .place_tt(pos.pageX, pos.pageY);
          } else {
            $tooltip.remove();
          }
        });

      }
    };
  });

});
