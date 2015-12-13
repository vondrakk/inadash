/** @scratch /panels/5
 *
 * include::panels/bettermap.asciidoc[]
 */

/** @scratch /panels/bettermap/0
 *
 * == Bettermap
 * Status: *Experimental*
 *
 * Bettermap is called bettermap for lack of a better name. Bettermap uses geographic coordinates to
 * create clusters of markers on map and shade them orange, yellow and green depending on the
 * density of the cluster.
 *
 * To drill down, click on a cluster. The map will be zoomed and the cluster broken into smaller cluster.
 * When it no longer makes visual sense to cluster, individual markers will be displayed. Hover over
 * a marker to see the tooltip value/
 *
 * IMPORTANT: bettermap requires an internet connection to download its map panels.
 */
define([
  'angular',
  'app',
  'lodash',
  './leaflet/leaflet-src',
  'require',

  'css!./module.css',
  'css!./leaflet/leaflet.css',
  'css!./leaflet/plugins.css'
],
function (angular, app, _, L, localRequire) {
  'use strict';

  var module = angular.module('kibana.panels.bettermap', []);
  app.useModule(module);

  module.controller('bettermap', function($scope, querySrv, dashboard, filterSrv) {
    $scope.panelMeta = {
      editorTabs : [
        {
          title: 'Queries',
          src: 'app/partials/querySelect.html'
        }
      ],
      modals : [
        {
          description: "Inspect",
          icon: "icon-info-sign",
          partial: "app/partials/inspector.html",
          show: $scope.panel.spyable
        }
      ],
      status  : "Experimental",
      description : "Displays geo points in clustered groups on a map. The caveat for this panel is"+
        " that, for better or worse, it does NOT use the terms facet and it <b>does</b> query "+
        "sequentially. This however means that it transfers more data and is generally heavier to"+
        " compute, while showing less actual data. If you have a time filter, it will attempt to"+
        " show to most recent points in your search, up to your defined limit."
    };

    // Set and populate defaults
    var _d = {
      /** @scratch /panels/bettermap/3
       *
       * === Parameters
       *
       * field:: The field that contains the coordinates, in geojson format. GeoJSON is
       * +[longitude,latitude]+ in an array. This is different from most implementations, which use
       * latitude, longitude.
       */
      field   : null,
      /** @scratch /panels/bettermap/5
       * provider:: The map provider of leaflet.js
       */
      provider: 'MapQuestOpen',
      /** @scratch /panels/bettermap/5
       * variant:: The map variant to use
       */
      variant: '',
      /** @scratch /panels/bettermap/5
       * providers:: The map providers available
       */
      providers: ['OpenStreetMap','OpenSeaMap','Thunderforest','OpenMapSurfer','Hydda','MapQuestOpen','MapBox','Stamen','Esri','OpenWeatherMap','HERE','Acetate','FreeMapSK','MtbMap','TianDiTu','MapABC','GaoDe'],
      /** @scratch /panels/bettermap/5
       * variants:: The map variants available
       */
      variants: {
			'OpenStreetMap':['Mapnik','BlackAndWhite','DE','HOT'],
			'OpenSeaMap':[],
			'Thunderforest':['OpenCycleMap','Transport','Landscape','Outdoors'],
			'OpenMapSurfer':['Roads','AdminBounds','Grayscale'],
			'Hydda':['Full','Base','RoadsAndLabels'],
			'MapQuestOpen':['OSM','Aerial'],
			'MapBox':[],
			'Stamen':['Toner','TonerBackground','TonerHybrid','TonerLines','TonerLabels','TonerLite','Terrain','TerrainBackground','Watercolor'],
			'Esri':['WorldStreetMap','DeLorme','WorldTopoMap','WorldImagery','WorldTerrain','WorldShadedRelief','WorldPhysical','OceanBasemap','NatGeoWorldMap','WorldGrayCanvas'],
			'OpenWeatherMap':['Clouds','CloudsClassic','Precipitation','PrecipitationClassic','Rain','RainClassic','Pressure','PressureContour','Wind','Temperature','Snow'],
			'HERE':['normalDay','normalDayCustom','normalDayGrey','normalDayMobile','normalDayGreyMobile','normalDayTransit','normalDayTransitMobile','normalNight','normalNightMobile','normalNightGrey','normalNightGreyMobile','carnavDayGrey','hybridDay','hybridDayMobile','pedestrianDay','pedestrianNight','satelliteDay','terrainDay','terrainDayMobile'],
			'Acetate':['basemap','terrain','all','foreground','roads','labels','hillshading'],
			'FreeMapSK':[],
			'MtbMap':[],
			'TianDiTu':['Satellite','Terrain'],
			'MapABC':[],
			'GaoDe':['Satellite']
		  },
      /** @scratch /panels/bettermap/5
       * provider_change:: Tripped when provider changes
       */		  
	  provider_change: false,
      /** @scratch /panels/bettermap/5
       * variant_change:: Tripped when variant changes
       */		  
	  variant_change: false,	  
      /** @scratch /panels/bettermap/5
       * size:: The number of documents to use when drawing the map
       */
      size    : 1000,
      /** @scratch /panels/bettermap/5
       * spyable:: Should the `inspect` icon be shown?
       */
      spyable : true,
      /** @scratch /panels/bettermap/5
       * tooltip:: Which field to use for the tooltip when hovering over a marker
       */
      tooltip : "_id",
      /** @scratch /panels/bettermap/5
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
    };

    _.defaults($scope.panel,_d);

    // inorder to use relative paths in require calls, require needs a context to run. Without
    // setting this property the paths would be relative to the app not this context/file.
    $scope.requireContext = localRequire;

    $scope.init = function() {
      $scope.$on('refresh',function(){
        $scope.get_data();
      });
      $scope.get_data();
    };

    $scope.get_data = function(segment,query_id) {
		var
        _segment,
        request,
        boolQuery,
        queries,
        sort;
        
      $scope.require(['./leaflet/plugins'], function () {
        $scope.panel.error =  false;

        // Make sure we have everything for the request to complete
        if(dashboard.indices.length === 0) {
          return;
        }

        if(_.isUndefined($scope.panel.field)) {
          $scope.panel.error = "Please select a field that contains geo point in [lon,lat] format";
          return;
        }

        // Determine the field to sort on
        var timeField = _.uniq(_.pluck(filterSrv.getByType('time'),'field'));
        if(timeField.length > 1) {
          $scope.panel.error = "Time field must be consistent amongst time filters";
        } else if(timeField.length === 0) {
          timeField = null;
        } else {
          timeField = timeField[0];
        }

      var _segment = _.isUndefined(segment) ? 0 : segment;
      $scope.segment = _segment;

      $scope.panel.queries.ids = querySrv.idsByMode($scope.panel.queries);

      queries = querySrv.getQueryObjs($scope.panel.queries.ids);

      boolQuery = $scope.ejs.BoolQuery();
      _.each(queries,function(q) {
        boolQuery = boolQuery.should(querySrv.toEjsObj(q));
      });

		var request = $scope.ejs.Request();
      request = request.query(
        $scope.ejs.FilteredQuery(
          boolQuery,
          filterSrv.getBoolFilter(filterSrv.ids()).must($scope.ejs.ExistsFilter($scope.panel.field))
        )
      )
      //.fields([$scope.panel.field,$scope.panel.tooltip])
      .size($scope.panel.size);

        if(!_.isNull(timeField)) {
          request = request.sort(timeField,'desc');
        }

        $scope.populate_modal(request);

        // Populate scope when we have results
		$scope.ejs.doSearch(dashboard.indices[_segment], request, $scope.panel.size).then(function(results) {
          $scope.panelMeta.loading = false;

          if(_segment === 0) {
            $scope.hits = 0;
            $scope.data = [];
            query_id = $scope.query_id = new Date().getTime();
          }

          // Check for error and abort if found
          if(!(_.isUndefined(results.error))) {
            $scope.panel.error = $scope.parse_error(results.error);
            return;
          }

          // Check that we're still on the same query, if not stop
          if($scope.query_id === query_id) {

            // Keep only what we need for the set
            $scope.data = $scope.data.slice(0,$scope.panel.size).concat(_.map(results.hits.hits, function(hit) {
				var lat = hit['_source'][$scope.panel.field]['lat'];
				var lon = hit['_source'][$scope.panel.field]['lon'];
              var o = {
                coordinates : new L.LatLng(lat,lon),
                tooltip : hit['_source'][$scope.panel.tooltip]
              };
              return o;
            }));

          } else {
            return;
          }

          $scope.$emit('draw');

          // Get $size results then stop querying
          if($scope.data.length < $scope.panel.size && _segment+1 < dashboard.indices.length) {
            $scope.get_data(_segment+1,$scope.query_id);
          }

        });
      });
    };

    $scope.populate_modal = function(request) {
      $scope.inspector = request.toJSON();
    };

  });

  module.directive('bettermap', function() {
    return {
      restrict: 'A',
      link: function(scope, elem) {
        elem.html('<center><img src="img/load_big.gif"></center>');

        // Receive render events
        scope.$on('draw',function(){
			if (scope.panel.provider_change || scope.panel.variant_change && !_.isUndefined(map)) {
				var unmap;
				map=unmap;
				while (elem[0].firstChild) {
					elem[0].removeChild(elem[0].firstChild);
				}
				elem[0]._leaflet=unmap;
			}
			scope.panel.provider_change = scope.panel.variant_change = false;
          //render_panel();
        });

        scope.$on('render', function(){
			if (scope.panel.provider_change || scope.panel.variant_change && !_.isUndefined(map)) {
				var unmap;
				map=unmap;
				while (elem[0].firstChild) {
					elem[0].removeChild(elem[0].firstChild);
				}
				elem[0]._leaflet=unmap;
			}
			scope.panel.provider_change = scope.panel.variant_change = false;
          if(!_.isUndefined(map)) {
            map.invalidateSize();
            map.getPanes();
          }
		  else {render_panel();}
        });

        var map, layerGroup;
		function map_factory() {
			return L.map(scope.$id, {
                scrollWheelZoom: true,
                center: [40, -86],
                zoom: 10
              });
		}

        function render_panel() {
          elem.css({height:scope.panel.height||scope.row.height});
		
          scope.require(['./leaflet/plugins', './leaflet/providers', './leaflet/api_skel', './leaflet/api'], function () {
            scope.panelMeta.loading = false;
            L.Icon.Default.imagePath = 'app/panels/bettermap/leaflet/images';
            if(_.isUndefined(map)) {
              map = map_factory();

              // This could be made more configurable?
              L.tileLayer.provider(scope.panel.provider+'.'+scope.panel.variant, {
                maxZoom: 18,
                minZoom: 2,
                app_id: api.app_id(),
                app_code: api.app_code()
              }).addTo(map);
              layerGroup = new L.MarkerClusterGroup({maxClusterRadius:30});
            } else {
              layerGroup.clearLayers();
            }

            var markerList = [];

            _.each(scope.data, function(p) {
              if(!_.isUndefined(p.tooltip) && p.tooltip !== '') {
                markerList.push(L.marker(p.coordinates).bindLabel(_.isArray(p.tooltip) ? p.tooltip[0] : p.tooltip));
              } else {
                markerList.push(L.marker(p.coordinates));
              }
            });

            layerGroup.addLayers(markerList);

            layerGroup.addTo(map);

            map.fitBounds(_.pluck(scope.data,'coordinates'));
          });
        }
      }
    };
  });

});
