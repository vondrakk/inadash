/*

  ## Stats Module

  ### Parameters
  * format :: The format of the value returned. (Default: number)
  * style :: The font size of the main number to be displayed.
  * mode :: The aggregate value to use for display
  * spyable ::  Dislay the 'eye' icon that show the last elasticsearch query

*/
define([
  'angular',
  'app',
  'lodash',
  'jquery',
  'kbn',
  'numeral'
], function (
  angular,
  app,
  _,
  $,
  kbn,
  numeral
) {

  'use strict';

  var module = angular.module('kibana.panels.stats', []);
  app.useModule(module);

  module.controller('stats', function ($scope, querySrv, dashboard, filterSrv) {

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
      status: 'Beta',
      description: 'A statistical panel for displaying aggregations using the Elastic Search statistical facet query.'
    };

    $scope.modes = ['count','min','max','mean','total','variance','std_deviation','sum_of_squares'];

    var defaults = {
      queries     : {
        mode        : 'all',
        ids         : []
      },
      style   : { "font-size": '20pt'},
      format: 'number',
      mode: 'count',
      display_breakdown: 'yes',
      field: [],
      sort_field: '',
      sort_reverse: false,
      label_name: 'Query',
      value_name: 'Value',
      spyable     : true,
      show: {
        count: true,
        min: true,
        max: true,
        mean: true,
        std_deviation: false,
        sum_of_squares: false,
        total: true,
        variance: false
      }
    };

    _.defaults($scope.panel, defaults);

    $scope.init = function () {
      $scope.ready = false;
      $scope.$on('refresh', function () {
        $scope.get_data();
      });
      $scope.get_data();
    };

    $scope.set_sort = function(field) {
      // console.log(field);
      if($scope.panel.sort_field === field && $scope.panel.sort_reverse === false) {
        $scope.panel.sort_reverse = true;
      } else if($scope.panel.sort_field === field && $scope.panel.sort_reverse === true) {
        $scope.panel.sort_field = '';
        $scope.panel.sort_reverse = false;
      } else {
        $scope.panel.sort_field = field;
        $scope.panel.sort_reverse = false;
      }
    };

    $scope.get_data = function () {
      if(dashboard.indices.length === 0) {
        return;
      }

      $scope.panelMeta.loading = true;

      var request,
        results,
        boolQuery,
        queries;

      request = $scope.ejs.Request();

      $scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);
      queries = querySrv.getQueryObjs($scope.panel.queries.ids);


      // This could probably be changed to a BoolFilter
      boolQuery = $scope.ejs.BoolQuery();
      _.each(queries,function(q) {
        boolQuery = boolQuery.should(querySrv.toEjsObj(q));
      });

      // Field or Fields query?
      if ($scope.panel.field instanceof Array && $scope.panel.field.length === 1) { 

	      $scope.panel.field.join();

	      request = request
	        .facet($scope.ejs.StatisticalFacet('stats')
	          .field($scope.panel.field)
	          .facetFilter($scope.ejs.QueryFilter(
	            $scope.ejs.FilteredQuery(
	              boolQuery,
	              filterSrv.getBoolFilter(filterSrv.ids())
	              )))).size(0);
	
	      _.each(queries, function (q) {
	        var alias = q.alias || q.query;
	        var query = $scope.ejs.BoolQuery();
	        query.should(querySrv.toEjsObj(q));
	        request.facet($scope.ejs.StatisticalFacet('stats_'+alias)
	          .field($scope.panel.field)
	          .facetFilter($scope.ejs.QueryFilter(
	            $scope.ejs.FilteredQuery(
	              query,
	              filterSrv.getBoolFilter(filterSrv.ids())
	            )
	          ))
	        );
	      });


      }	else {

	// console.log('Multi-Search');

	      request = request
	        .facet($scope.ejs.StatisticalFacet('stats')
	          .fields($scope.panel.field)
	          .facetFilter($scope.ejs.QueryFilter(
	            $scope.ejs.FilteredQuery(
	              boolQuery,
	              filterSrv.getBoolFilter(filterSrv.ids())
	              )))).size(0);

	      _.each(queries, function (q) {
	        var alias = q.alias || q.query;
	        var query = $scope.ejs.BoolQuery();
	        query.should(querySrv.toEjsObj(q));
	        request.facet($scope.ejs.StatisticalFacet('stats_'+alias)
	          .fields($scope.panel.field)
	          .facetFilter($scope.ejs.QueryFilter(
	            $scope.ejs.FilteredQuery(
	              query,
	              filterSrv.getBoolFilter(filterSrv.ids())
	            )
	          ))
	        );
	      });


      }

      // Populate the inspector panel
		$scope.inspector = request.toJSON();

      $scope.ejs.doSearch(dashboard.indices, request).then(function(results) {
	        $scope.panelMeta.loading = false;
	        var value = results.facets.stats[$scope.panel.mode];
	
	        var rows = queries.map(function (q) {
	          var alias = q.alias || q.query;
	          var obj = _.clone(q);
	          obj.label = alias;
	          obj.Label = alias.toLowerCase(); //sort field
	          obj.value = results.facets['stats_'+alias];
	          obj.Value = results.facets['stats_'+alias]; //sort field
	          return obj;
	        });

	        $scope.data = {
	          value: value,
	          rows: rows
	        };
	
	        // console.log($scope.data);
	
	        $scope.$emit('render');
	      });

           // console.log($scope.data);
           $scope.$emit('render');

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

  });

  module.filter('formatstats', function(){
    return function (value,format) {
      switch (format) {
      case 'money':
        value = numeral(value).format('$0,0.00');
        break;
      case 'bytes':
        value = numeral(value).format('0.00b');
        break;
      case 'float':
        value = numeral(value).format('0.000');
        break;
      default:
        value = numeral(value).format('0,0');
      }
      return value;
    };
  });

});
