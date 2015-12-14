// <https://github.com/leaflet-extras/leaflet-providers>
// <https://github.com/htoooth/Leaflet.ChineseTmsProviders>
(function () {
  'use strict';

  L.TileLayer.Provider = L.TileLayer.extend({
    initialize: function (arg, options) {
		
      var providers = L.TileLayer.Provider.providers;

      var parts = arg.split('.');

      var providerName = parts[0];
      var variantName = parts[1];

      if (!providers[providerName]) {
        throw 'No such provider (' + providerName + ')';
      }

      var provider = {
        url: providers[providerName].url,
        options: providers[providerName].options
      };

      // overwrite values in provider from variant.
      if (variantName && 'variants' in providers[providerName]) {
        if (!(variantName in providers[providerName].variants)) {
          throw 'No such variant of ' + providerName + '.' + variantName;
        }
        var variant = providers[providerName].variants[variantName];
        var variantOptions;
        if (typeof variant === 'string') {
          variantOptions = {
            variant: variant
          };
        } else {
          variantOptions = variant.options;
        }
        provider = {
          url: variant.url || provider.url,
          options: L.Util.extend({}, provider.options, variantOptions)
        };
      } else if (typeof provider.url === 'function') {
        provider.url = provider.url(parts.splice(1, parts.length - 1).join('.'));
      }

      // replace attribution placeholders with their values from toplevel provider attribution,
      // recursively
      var attributionReplacer = function (attr) {
        if (attr.indexOf('{attribution.') === -1) {
          return attr;
        }
        return attr.replace(/\{attribution.(\w*)\}/,
          function (match, attributionName) {
            return attributionReplacer(providers[attributionName].options.attribution);
          }
        );
      };
      provider.options.attribution = attributionReplacer(provider.options.attribution);

      // Compute final options combining provider options with any user overrides
      
      var layerOpts = L.Util.extend({}, provider.options, options);
      console.log(provider.url, layerOpts);
      L.TileLayer.prototype.initialize.call(this, provider.url, layerOpts);
    }
  });

  /**
   * Definition of providers.
   * see http://leafletjs.com/reference.html#tilelayer for options in the options map.
   */

  //jshint maxlen:220
  L.TileLayer.Provider.providers = {
    OpenStreetMap: {
      url: 'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      options: {
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      },
      variants: {
        Mapnik: {},
        BlackAndWhite: {
          url: 'http://{s}.www.toolserver.org/tiles/bw-mapnik/{z}/{x}/{y}.png'
        },
        DE: {
          url: 'http://{s}.tile.openstreetmap.de/tiles/osmde/{z}/{x}/{y}.png'
        },
        HOT: {
          url: 'http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
          options: {
            attribution: '{attribution.OpenStreetMap}, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
          }
        }
      }
    },
    OpenSeaMap: {
      url: 'http://tiles.openseamap.org/seamark/{z}/{x}/{y}.png',
      options: {
        attribution: 'Map data: &copy; <a href="http://www.openseamap.org">OpenSeaMap</a> contributors'
      }
    },
    Thunderforest: {
      url: 'http://{s}.tile.thunderforest.com/{variant}/{z}/{x}/{y}.png',
      options: {
        attribution:
          '&copy; <a href="http://www.opencyclemap.org">OpenCycleMap</a>, {attribution.OpenStreetMap}',
        variant: 'cycle'
      },
      variants: {
        OpenCycleMap: 'cycle',
        Transport: 'transport',
        Landscape: 'landscape',
        Outdoors: 'outdoors'
      }
    },
    OpenMapSurfer: {
      url: 'http://openmapsurfer.uni-hd.de/tiles/{variant}/x={x}&y={y}&z={z}',
      options: {
        minZoom: 0,
        maxZoom: 20,
        variant: 'roads',
        attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data {attribution.OpenStreetMap}'
      },
      variants: {
        Roads: 'roads',
        AdminBounds: {
          options: {
            variant: 'adminb',
            maxZoom: 19
          }
        },
        Grayscale: {
          options: {
            variant: 'roadsg',
            maxZoom: 19
          }
        }
      }
    },
    Hydda: {
      url: 'http://{s}.tile.openstreetmap.se/hydda/{variant}/{z}/{x}/{y}.png',
      options: {
        minZoom: 0,
        maxZoom: 18,
        variant: 'full',
        attribution: 'Tiles courtesy of <a href="http://openstreetmap.se/" target="_blank">OpenStreetMap Sweden</a> &mdash; Map data {attribution.OpenStreetMap}'
      },
      variants: {
        Full: 'full',
        Base: 'base',
        RoadsAndLabels: 'roads_and_labels',
      }
    },
    MapQuestOpen: {
      url: 'http://otile{s}.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpeg',
      options: {
        attribution:
          'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
          'Map data {attribution.OpenStreetMap}',
        subdomains: '1234'
      },
      variants: {
        OSM: {},
        Aerial: {
          url: 'http://oatile{s}.mqcdn.com/tiles/1.0.0/sat/{z}/{x}/{y}.jpg',
          options: {
            attribution:
              'Tiles Courtesy of <a href="http://www.mapquest.com/">MapQuest</a> &mdash; ' +
              'Portions Courtesy NASA/JPL-Caltech and U.S. Depart. of Agriculture, Farm Service Agency'
          }
        }
      }
    },
    MapBox: {
      url: 'http://api.mapbox.com/v4/{variant}/{z}/{x}/{y}.png?access_token={mapbox_api_token}',
      options: {
        attribution:
          'Imagery from <a href="http://mapbox.com/about/maps/">MapBox</a> &mdash; ' +
          'Map data {attribution.OpenStreetMap}',
        subdomains: 'abcd'
      },
      variants: {
        Streets: 'mapbox.streets',
        Light: 'mapbox.light',
        Dark: 'mapbox.dark',
        Satellite: 'mapbox.satellite',
        StreetsSatellite: 'mapbox.streets-satellite',
        Wheatpaste: 'mapbox.wheatpaste',
        StreetsBasic: 'mapbox.streets-basic',
        Comic: 'mapbox.comic',
        Outdoors: 'mapbox.outdoors',
        RunBikeHike: 'mapbox.run-bike-hike',
        Pencil: 'mapbox.pencil',
        Pirates: 'mapbox.pirates',
        Emerald: 'mapbox.emerald',
        HighContrast: 'mapbox.high-contrast'
	  }
    },
    Stamen: {
      url: 'http://{s}.tile.stamen.com/{variant}/{z}/{x}/{y}.png',
      options: {
        attribution:
          'Map tiles by <a href="http://stamen.com">Stamen Design</a>, ' +
          '<a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; ' +
          'Map data {attribution.OpenStreetMap}',
        subdomains: 'abcd',
        minZoom: 0,
        maxZoom: 20,
        variant: 'toner'
      },
      variants: {
        Toner: 'toner',
        TonerBackground: 'toner-background',
        TonerHybrid: 'toner-hybrid',
        TonerLines: 'toner-lines',
        TonerLabels: 'toner-labels',
        TonerLite: 'toner-lite',
        Terrain: {
          options: {
            variant: 'terrain',
            minZoom: 4,
            maxZoom: 18
          }
        },
        TerrainBackground: {
          options: {
            variant: 'terrain-background',
            minZoom: 4,
            maxZoom: 18
          }
        },
        Watercolor: {
          options: {
            variant: 'watercolor',
            minZoom: 1,
            maxZoom: 16
          }
        }
      }
    },
    Esri: {
      url: 'http://server.arcgisonline.com/ArcGIS/rest/services/{variant}/MapServer/tile/{z}/{y}/{x}',
      options: {
        variant: 'World_Street_Map',
        attribution: 'Tiles &copy; Esri'
      },
      variants: {
        WorldStreetMap: {
          options: {
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
          }
        },
        DeLorme: {
          options: {
            variant: 'Specialty/DeLorme_World_Base_Map',
            minZoom: 1,
            maxZoom: 11,
            attribution: '{attribution.Esri} &mdash; Copyright: &copy;2012 DeLorme'
          }
        },
        WorldTopoMap: {
          options: {
            variant: 'World_Topo_Map',
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
          }
        },
        WorldImagery: {
          options: {
            variant: 'World_Imagery',
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          }
        },
        WorldTerrain: {
          options: {
            variant: 'World_Terrain_Base',
            maxZoom: 13,
            attribution:
              '{attribution.Esri} &mdash; ' +
              'Source: USGS, Esri, TANA, DeLorme, and NPS'
          }
        },
        WorldShadedRelief: {
          options: {
            variant: 'World_Shaded_Relief',
            maxZoom: 13,
            attribution: '{attribution.Esri} &mdash; Source: Esri'
          }
        },
        WorldPhysical: {
          options: {
            variant: 'World_Physical_Map',
            maxZoom: 8,
            attribution: '{attribution.Esri} &mdash; Source: US National Park Service'
          }
        },
        OceanBasemap: {
          options: {
            variant: 'Ocean_Basemap',
            maxZoom: 13,
            attribution: '{attribution.Esri} &mdash; Sources: GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri'
          }
        },
        NatGeoWorldMap: {
          options: {
            variant: 'NatGeo_World_Map',
            maxZoom: 16,
            attribution: '{attribution.Esri} &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC'
          }
        },
        WorldGrayCanvas: {
          options: {
            variant: 'Canvas/World_Light_Gray_Base',
            maxZoom: 16,
            attribution: '{attribution.Esri} &mdash; Esri, DeLorme, NAVTEQ'
          }
        }
      }
    },
    OpenWeatherMap: {
      url: 'http://{s}.tile.openweathermap.org/map/{variant}/{z}/{x}/{y}.png',
      options: {
        attribution: 'Map data &copy; <a href="http://openweathermap.org">OpenWeatherMap</a>',
        opacity: 0.5
      },
      variants: {
        Clouds: 'clouds',
        CloudsClassic: 'clouds_cls',
        Precipitation: 'precipitation',
        PrecipitationClassic: 'precipitation_cls',
        Rain: 'rain',
        RainClassic: 'rain_cls',
        Pressure: 'pressure',
        PressureContour: 'pressure_cntr',
        Wind: 'wind',
        Temperature: 'temp',
        Snow: 'snow'
      }
    },
    HERE: {
      /*
       * HERE maps, formerly Nokia maps.
       * These basemaps are free, but you need an API key. Please sign up at
       * http://developer.here.com/getting-started
       *
       * Note that the base urls contain '.cit' whichs is HERE's
       * 'Customer Integration Testing' environment. Please remove for production
       * envirionments.
       */
      url:
        'https://{s}.{base}.maps.cit.api.here.com/maptile/2.1/' +
        'maptile/{mapID}/{variant}/{z}/{x}/{y}/256/png8?' +
        'app_id={here_app_id}&app_code={here_app_code}',
      options: {
        attribution:
          'Map &copy; 1987-2014 <a href="http://developer.here.com">HERE</a>',
        subdomains: '1234',
        mapID: 'newest',
        base: 'base',
        variant: 'normal.day',
        minZoom: 0,
        maxZoom: 20
      },
      variants: {
        normalDay: 'normal.day',
        normalDayCustom: 'normal.day.custom',
        normalDayGrey: 'normal.day.grey',
        normalDayMobile: 'normal.day.mobile',
        normalDayGreyMobile: 'normal.day.grey.mobile',
        normalDayTransit: 'normal.day.transit',
        normalDayTransitMobile: 'normal.day.transit.mobile',
        normalNight: 'normal.night',
        normalNightMobile: 'normal.night.mobile',
        normalNightGrey: 'normal.night.grey',
        normalNightGreyMobile: 'normal.night.grey.mobile',

        carnavDayGrey: 'carnav.day.grey',
        hybridDay: {
          options: {
            base: 'aerial',
            variant: 'hybrid.day'
          }
        },
        hybridDayMobile: {
          options: {
            base: 'aerial',
            variant: 'hybrid.day.mobile'
          }
        },
        pedestrianDay: 'pedestrian.day',
        pedestrianNight: 'pedestrian.night',
        satelliteDay: {
          options: {
            base: 'aerial',
            variant: 'satellite.day'
          }
        },
        terrainDay: {
          options: {
            base: 'aerial',
            variant: 'terrain.day'
          }
        },
        terrainDayMobile: {
          options: {
            base: 'aerial',
            variant: 'terrain.day.mobile'
          }
        }
      }
    },
    Acetate: {
      url: 'http://a{s}.acetate.geoiq.com/tiles/{variant}/{z}/{x}/{y}.png',
      options: {
        attribution:
          '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
        subdomains: '0123',
        minZoom: 2,
        maxZoom: 18,
        variant: 'acetate-base'
      },
      variants: {
        basemap: 'acetate-base',
        terrain: 'terrain',
        all: 'acetate-hillshading',
        foreground: 'acetate-fg',
        roads: 'acetate-roads',
        labels: 'acetate-labels',
        hillshading: 'hillshading'
      }
    },
    FreeMapSK: {
      url: 'http://{s}.freemap.sk/T/{z}/{x}/{y}.jpeg',
      options: {
        minZoom: 8,
        maxZoom: 16,
        subdomains: ['t1', 't2', 't3', 't4'],
        attribution:
          '{attribution.OpenStreetMap}, vizualization CC-By-SA 2.0 <a href="http://freemap.sk">Freemap.sk</a>'
      }
    },
    MtbMap: {
      url: 'http://tile.mtbmap.cz/mtbmap_tiles/{z}/{x}/{y}.png',
      options: {
        attribution:
          '{attribution.OpenStreetMap} &amp; USGS'
      }
    },
    TianDiTu: {
      url: "http://t{s}.tianditu.cn/DataServer?T=vec_w&X={x}&Y={y}&L={z}",
      options: {
        subdomains:['0','1','2','3','4','5','6','7']
      },
      variants: {
        Satellite: {
          url: "http://t{s}.tianditu.cn/DataServer?T=img_w&X={x}&Y={y}&L={z}"
        },
        Terrain: {
          url: "http://t{s}.tianditu.cn/DataServer?T=ter_w&X={x}&Y={y}&L={z}"
        }
      }
    },
    MapABC: {
      url: 'http://emap{s}.mapabc.com/mapabc/maptile?&x={x}&y={y}&z={z}',
      options: {
        subdomains:["0","1","2","3"]
      }
    },
    GaoDe: {
      url: 'http://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
      options: {
        subdomains:["1","2","3","4"],
        attribution: '高德地图'
      },
      variants: {
        Satellite:{
          url: 'http://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}'
        }
      }
    }
  };

  L.tileLayer.provider = function (provider, options) {
    return new L.TileLayer.Provider(provider, options);
  };
}());
